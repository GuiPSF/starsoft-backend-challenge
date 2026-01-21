import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { CreateSessionUseCase } from './application/create-session.usecase';
import { ListSessionSeatsUseCase } from './application/list-session-seats.usecase';
import { CreateSessionDto } from './application/dto/create-session.dto';

@Controller('sessions')
export class SessionController {
  constructor(
    private readonly createSession: CreateSessionUseCase,
    private readonly listSessionSeats: ListSessionSeatsUseCase,
  ) {}

  @Post()
  create(@Body() dto: CreateSessionDto) {
    return this.createSession.execute(dto);
  }

  @Get(':id/seats')
  listSeats(@Param('id') sessionId: string) {
    return this.listSessionSeats.execute(sessionId);
  }
}
