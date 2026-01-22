import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateSessionDto } from './application/dto/create-session.dto';
import { SeatAvailabilityDto } from './application/dto/seat-availability.dto';
import { CreateSessionUseCase } from './application/create-session.usecase';
import { ListSessionSeatsUseCase } from './application/list-session-seats.usecase';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionController {
  constructor(
    private readonly createSession: CreateSessionUseCase,
    private readonly listSeats: ListSessionSeatsUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a cinema session' })
  @ApiCreatedResponse({ description: 'Session created successfully' })
  create(@Body() dto: CreateSessionDto) {
    return this.createSession.execute(dto);
  }

  @Get(':id/seats')
  @ApiOperation({ summary: 'List seat availability for a session' })
  @ApiOkResponse({ type: SeatAvailabilityDto, isArray: true })
  list(@Param('id') sessionId: string) {
    return this.listSeats.execute(sessionId);
  }
}
