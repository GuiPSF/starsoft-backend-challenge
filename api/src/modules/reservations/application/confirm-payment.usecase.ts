import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Reservation } from '../entities/reservation.entity';
import { Seat } from '../../sessions/entities/seat.entity';
import { RabbitPublisher } from '../../../infra/messaging/rabbitmq.publisher';

@Injectable()
export class ConfirmPaymentUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly publisher: RabbitPublisher,
  ) {}

  async execute(reservationId: string, paymentRef?: string) {
    const now = new Date();

    const result = await this.dataSource.transaction(async (manager) => {
      // 1) Trava a reserva (sem JOIN) pra evitar corrida com o expirer
      const reservation = await manager
        .createQueryBuilder(Reservation, 'r')
        .setLock('pessimistic_write')
        .where('r.id = :id', { id: reservationId })
        .getOne();

      if (!reservation) throw new NotFoundException('Reservation not found');

      // 2) Idempotência
      if (reservation.status === 'CONFIRMED') {
        return { status: 'CONFIRMED' as const, reservation };
      }

      if (reservation.status === 'EXPIRED') {
        throw new ConflictException('Reservation is expired');
      }

      // 3) Não confirma se já passou do tempo
      if (reservation.expiresAt <= now) {
        // opcional: marcar como EXPIRED aqui também (defensivo)
        await manager.update(
          Reservation,
          { id: reservation.id, status: 'PENDING' },
          { status: 'EXPIRED' },
        );
        throw new ConflictException('Reservation is expired');
      }

      // 4) Pega assentos da tabela de junção (sem join lock)
      const rows = await manager.query(
        `SELECT seat_id FROM reservation_seats WHERE reservation_id = $1`,
        [reservation.id],
      );
      const seatIds: string[] = rows.map((x: any) => x.seat_id);

      if (seatIds.length === 0) {
        throw new BadRequestException('Reservation has no seats');
      }

      // 5) Trava os assentos e valida que ainda estão RESERVED
      const seats = await manager
        .createQueryBuilder(Seat, 's')
        .setLock('pessimistic_write')
        .where('s.id = ANY(:ids)', { ids: seatIds })
        .getMany();

      if (seats.length !== seatIds.length) {
        throw new ConflictException('Some seats were not found');
      }

      const notReserved = seats.find((s) => s.status !== 'RESERVED');
      if (notReserved) {
        // Se alguém já vendeu/alterou, não confirma
        throw new ConflictException('Seats are not reserved anymore');
      }

      // 6) Confirma e vende
      await manager.update(
        Reservation,
        { id: reservation.id, status: 'PENDING' },
        { status: 'CONFIRMED' },
      );

      await manager
        .createQueryBuilder()
        .update(Seat)
        .set({ status: 'SOLD' })
        .where('id = ANY(:ids)', { ids: seatIds })
        .execute();

      return { status: 'CONFIRMED' as const, reservation, seatIds };
    });

    // 7) Evento fora da transação
    if (result.status === 'CONFIRMED') {
      await this.publisher.publish('payment.confirmed', {
        reservationId,
        sessionId: result.reservation.sessionId,
        userId: result.reservation.userId,
        paymentRef: paymentRef ?? null,
      });
    }

    return {
      reservationId,
      status: result.status,
    };
  }
}
