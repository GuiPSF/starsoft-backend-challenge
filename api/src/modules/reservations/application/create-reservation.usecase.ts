import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { Reservation } from '../entities/reservation.entity';
import { Seat, SeatStatus } from '../../sessions/entities/seat.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { RabbitPublisher } from '../../../infra/messaging/rabbitmq.publisher';
import { RedisService } from '../../../infra/redis/redis.service';

@Injectable()
export class CreateReservationUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly publisher: RabbitPublisher,
    private readonly redis: RedisService,
  ) {}

  async execute(dto: CreateReservationDto) {
    if (new Set(dto.seatIds).size !== dto.seatIds.length) {
      throw new BadRequestException('Duplicate seatIds');
    }

    const expiresAt = new Date(Date.now() + 30_000);

    const result = await this.dataSource.transaction(async (manager) => {
      // lock determinístico para reduzir deadlock
      const seats = await manager.find(Seat, {
        where: { id: In(dto.seatIds), sessionId: dto.sessionId },
        order: { id: 'ASC' },
        lock: { mode: 'pessimistic_write' },
      });

      if (seats.length !== dto.seatIds.length) {
        throw new ConflictException('Some seats not found for this session');
      }

      const unavailable = seats.find((s) => s.status !== 'AVAILABLE');
      if (unavailable) {
        throw new ConflictException('Some seats are not available');
      }

      // marcar assentos como RESERVED
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

    return { reservationId: result.id, expiresAt: result.expiresAt };
  }
}
