import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionController } from './session.controller';
import { Session } from './entities/session.entity';
import { Seat } from './entities/seat.entity';
import { CreateSessionUseCase } from './application/create-session.usecase';
import { ListSessionSeatsUseCase } from './application/list-session-seats.usecase';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Seat])],
  controllers: [SessionController],
  providers: [CreateSessionUseCase, ListSessionSeatsUseCase],
})
export class SessionModule {}
