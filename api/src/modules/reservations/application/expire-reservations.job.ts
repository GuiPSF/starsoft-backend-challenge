import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { Reservation } from '../entities/reservation.entity';
import { Seat } from '../../sessions/entities/seat.entity';
import { RabbitPublisher } from '../../../infra/messaging/rabbitmq.publisher';

@Injectable()
export class ExpireReservationsJob {
  constructor(
    private readonly dataSource: DataSource,
    private readonly publisher: RabbitPublisher,
  ) {}

@Cron(CronExpression.EVERY_10_SECONDS)
async run() {
  const now = new Date();

  await this.dataSource.transaction(async (manager) => {
    // 1) Pegue reservas expiradas e trave só a tabela reservations (sem JOIN)
    const expired = await manager
      .createQueryBuilder(Reservation, 'r')
      .setLock('pessimistic_write')
      .where('r.status = :status', { status: 'PENDING' })
      .andWhere('r.expiresAt < :now', { now })
      .limit(50)
      .getMany();

    for (const r of expired) {
      // 2) Marque a reserva como EXPIRED
      const updateRes = await manager.update(
        Reservation,
        { id: r.id, status: 'PENDING' },
        { status: 'EXPIRED' },
      );

      if (updateRes.affected !== 1) continue;

      // 3) Busque ids dos assentos na tabela de junção (SEM JOIN + SEM LOCK)
      const rows = await manager.query(
        `SELECT seat_id FROM reservation_seats WHERE reservation_id = $1`,
        [r.id],
      );

      const seatIds: string[] = rows.map((x: any) => x.seat_id);

      if (seatIds.length > 0) {
        // 4) Libere os assentos em lote
        await manager
          .createQueryBuilder()
          .update(Seat)
          .set({ status: 'AVAILABLE' })
          .where('id = ANY(:ids)', { ids: seatIds })
          .execute();
      }

      // 5) Publique eventos
      await this.publisher.publish('reservation.expired', {
        reservationId: r.id,
        sessionId: r.sessionId,
        userId: r.userId,
      });

      await this.publisher.publish('seat.released', {
        reservationId: r.id,
        seatIds,
      });
    }
  });
}

}
