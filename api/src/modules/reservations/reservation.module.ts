import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Reservation } from './entities/reservation.entity';
import { Seat } from '../sessions/entities/seat.entity';
import { ReservationController } from './reservation.controller';
import { CreateReservationUseCase } from './application/create-reservation.usecase';
import { ExpireReservationsJob } from './application/expire-reservations.job';
import { RabbitPublisher } from '../../infra/messaging/rabbitmq.publisher';
import { RedisService } from '../../infra/redis/redis.service';
import { ConfirmPaymentUseCase } from './application/confirm-payment.usecase';
import { IdempotencyService } from '../../infra/redis/idempotency.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Seat]),
    ScheduleModule.forRoot(),
  ],
  controllers: [ReservationController],
  providers: [
    CreateReservationUseCase,
    ConfirmPaymentUseCase,
    ExpireReservationsJob,
    RabbitPublisher,
    RedisService,
    IdempotencyService,
  ],
})
export class ReservationModule {}
