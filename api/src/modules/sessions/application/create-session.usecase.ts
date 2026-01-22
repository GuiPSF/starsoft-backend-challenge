import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Session } from '../entities/session.entity';
import { Seat, SeatStatus } from '../entities/seat.entity';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class CreateSessionUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(dto: CreateSessionDto) {
    const seatCount = dto.seatCount ?? 16;

    return this.dataSource.transaction(async (manager) => {
      const session = manager.create(Session, {
        movie: dto.movie,
        startTime: new Date(dto.startTime),
        room: dto.room,
        priceCents: dto.priceCents,
      });

      const savedSession = await manager.save(Session, session);

      const seats = Array.from({ length: seatCount }, (_, i) =>
        manager.create(Seat, {
          sessionId: savedSession.id,
          number: i + 1,
          status: SeatStatus.AVAILABLE,
        }),
      );

      await manager.save(Seat, seats);

      // retornar com seats (se quiser)
      return {
        ...savedSession,
        seats,
      };
    });
  }
}
