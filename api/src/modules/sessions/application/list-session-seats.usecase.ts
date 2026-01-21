import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import { Seat } from '../entities/seat.entity';
import { SeatAvailabilityDto } from './dto/seat-availability.dto';

@Injectable()
export class ListSessionSeatsUseCase {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,

    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
  ) {}

  async execute(sessionId: string): Promise<SeatAvailabilityDto[]> {
    const sessionExists = await this.sessionRepository.exist({
      where: { id: sessionId },
    });

    if (!sessionExists) {
      throw new NotFoundException('Session not found');
    }

    const seats = await this.seatRepository.find({
      where: { sessionId },
      order: { number: 'ASC' },
    });

    return seats.map((seat) => ({
      id: seat.id,
      number: seat.number,
      status: seat.status,
    }));
  }
}
