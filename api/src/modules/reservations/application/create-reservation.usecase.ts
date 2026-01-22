import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { Reservation } from '../entities/reservation.entity';
import { Seat, SeatStatus } from '../../sessions/entities/seat.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { RabbitPublisher } from '../../../infra/messaging/rabbitmq.publisher';
import { RedisService } from '../../../infra/redis/redis.service';
import { IdempotencyService } from '../../../infra/redis/idempotency.service';

@Injectable()
export class CreateReservationUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly publisher: RabbitPublisher,
    private readonly redis: RedisService,
    private readonly idempo: IdempotencyService,
  ) {}

  async execute(dto: CreateReservationDto, idempotencyKey?: string) {
    if (idempotencyKey) {
      const cached = await this.idempo.get<{ reservationId: string; expiresAt: string }>(
        'reservations:create',
        idempotencyKey,
      );
      if (cached) return cached;
    }

    if (new Set(dto.seatIds).size !== dto.seatIds.length) {
      throw new BadRequestException('Duplicate seatIds');
    }

    const expiresAt = new Date(Date.now() + 30_000);

    const result = await this.dataSource.transaction(async (manager) => {
      const seats = await manager.find(Seat, {
        where: { id: In(dto.seatIds), session: { id: dto.sessionId } as any },
        order: { id: 'ASC' as any },
        lock: { mode: 'pessimistic_write' },
      });

      if (seats.length !== dto.seatIds.length) {
        throw new ConflictException('Some seats not found for this session');
      }

      const unavailable = seats.find((s) => s.status !== SeatStatus.AVAILABLE);
      if (unavailable) {
        throw new ConflictException('Some seats are not available');
      }

      for (const seat of seats) seat.status = SeatStatus.RESERVED;
      await manager.save(Seat, seats);

      const reservation = manager.create(Reservation, {
        sessionId: dto.sessionId,
        userId: dto.userId,
        expiresAt,
        status: 'PENDING',
        seats,
      });

      return manager.save(Reservation, reservation);
    });

    await this.redis.client.set(`reservation:${result.id}`, 'PENDING', 'EX', 30);

    await this.publisher.publish('reservation.created', {
      reservationId: result.id,
      sessionId: result.sessionId,
      userId: result.userId,
      expiresAt: result.expiresAt,
      seatIds: dto.seatIds,
    });

    const response = {
      reservationId: result.id,
      expiresAt: result.expiresAt.toISOString(),
    };

    // Cache da resposta (idempotência)
    if (idempotencyKey) {
      await this.idempo.set('reservations:create', idempotencyKey, response, 60);
    }

    return response;
  }
}
