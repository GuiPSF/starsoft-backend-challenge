import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionModule } from './modules/sessions/session.module';
import { ReservationModule } from './modules/reservations/reservation.module';
import { SalesModule } from './modules/sales/sales.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    SessionModule,
    ReservationModule,
    SalesModule,
  ],
})
export class AppModule {}
