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
      // Pega reservas expiradas e tranca linhas para evitar corrida entre instâncias
      const expired = await manager
        .createQueryBuilder(Reservation, 'r')
        .setLock('pessimistic_write')
        .where('r.status = :status', { status: 'PENDING' })
        .andWhere('r.expiresAt < :now', { now })
        .limit(50)
        .getMany();

      for (const r of expired) {
        // recarrega assentos associados
        const full = await manager.findOne(Reservation, {
          where: { id: r.id },
          relations: { seats: true },
          lock: { mode: 'pessimistic_write' },
        });

        if (!full || full.status !== 'PENDING') continue;

        full.status = 'EXPIRED';
        await manager.save(Reservation, full);

        // libera assentos
        for (const seat of full.seats) seat.status = 'AVAILABLE';
        await manager.save(Seat, full.seats);

        await this.publisher.publish('reservation.expired', {
          reservationId: full.id,
          sessionId: full.sessionId,
          userId: full.userId,
        });

        await this.publisher.publish('seat.released', {
          reservationId: full.id,
          seatIds: full.seats.map((s) => s.id),
        });
      }
    });
  }
}
