import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { Session } from './entities/session.entity';
import { Seat } from './entities/seat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Seat])],
  providers: [SessionService],
  controllers: [SessionController],
  exports: [TypeOrmModule],
})
export class SessionModule {}
