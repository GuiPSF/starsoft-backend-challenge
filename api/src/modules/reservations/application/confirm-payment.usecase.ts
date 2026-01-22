import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Reservation } from '../entities/reservation.entity';
import { Seat, SeatStatus } from '../../sessions/entities/seat.entity';
import { RabbitPublisher } from '../../../infra/messaging/rabbitmq.publisher';
import { Session } from '../../sessions/entities/session.entity';
import { Sale } from '../../sales/entities/sale.entity';
import { IdempotencyService } from '../../../infra/redis/idempotency.service';

@Injectable()
export class ConfirmPaymentUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly publisher: RabbitPublisher,
    private readonly idempo: IdempotencyService,
  ) {}

  async execute(reservationId: string, paymentRef?: string, idempotencyKey?: string) {
    if (idempotencyKey) {
      const cached = await this.idempo.get<{ reservationId: string; status: string }>(
        'reservations:confirm-payment',
        idempotencyKey,
      );
      if (cached) return cached;
    }

    const now = new Date();

    const result = await this.dataSource.transaction(async (manager) => {
      const reservation = await manager
        .createQueryBuilder(Reservation, 'r')
        .setLock('pessimistic_write')
        .where('r.id = :id', { id: reservationId })
        .getOne();

      if (!reservation) throw new NotFoundException('Reservation not found');

      // Idempotência no estado
      if (reservation.status === 'CONFIRMED') {
        return { status: 'CONFIRMED' as const, reservation };
      }

      if (reservation.status === 'EXPIRED') {
        throw new ConflictException('Reservation is expired');
      }

      if (reservation.expiresAt <= now) {
        await manager.update(
          Reservation,
          { id: reservation.id, status: 'PENDING' },
          { status: 'EXPIRED' },
        );
        throw new ConflictException('Reservation is expired');
      }

      const rows = await manager.query(
        `SELECT seat_id FROM reservation_seats WHERE reservation_id = $1`,
        [reservation.id],
      );
      const seatIds: string[] = rows.map((x: any) => x.seat_id);

      if (seatIds.length === 0) {
        throw new BadRequestException('Reservation has no seats');
      }

      const seats = await manager
        .createQueryBuilder(Seat, 's')
        .setLock('pessimistic_write')
        .where('s.id = ANY(:ids)', { ids: seatIds })
        .getMany();

      if (seats.length !== seatIds.length) {
        throw new ConflictException('Some seats were not found');
      }

      const notReserved = seats.find((s) => s.status !== SeatStatus.RESERVED);
      if (notReserved) {
        throw new ConflictException('Seats are not reserved anymore');
      }

      await manager.update(
        Reservation,
        { id: reservation.id, status: 'PENDING' },
        { status: 'CONFIRMED' },
      );

      await manager
        .createQueryBuilder()
        .update(Seat)
        .set({ status: SeatStatus.SOLD })
        .where('id = ANY(:ids)', { ids: seatIds })
        .execute();

      const session = await manager.findOne(Session, {
        where: { id: reservation.sessionId },
      });

      if (!session) throw new ConflictException('Session not found');

      const totalPaidCents = session.priceCents * seatIds.length;

      const existingSale = await manager.findOne(Sale, {
        where: { reservationId: reservation.id },
      });

      if (!existingSale) {
        const sale = manager.create(Sale, {
          reservationId: reservation.id,
          sessionId: reservation.sessionId,
          userId: reservation.userId,
          totalPaidCents,
          paymentRef: paymentRef ?? null,
        });
        await manager.save(Sale, sale);
      }

      return { status: 'CONFIRMED' as const, reservation };
    });

    const response = { reservationId, status: result.status };

    if (idempotencyKey) {
      await this.idempo.set('reservations:confirm-payment', idempotencyKey, response, 86400);
    }

    if (result.status === 'CONFIRMED') {
      await this.publisher.publish('payment.confirmed', {
        reservationId,
        sessionId: result.reservation.sessionId,
        userId: result.reservation.userId,
        paymentRef: paymentRef ?? null,
      });
    }

    return response;
  }
}
