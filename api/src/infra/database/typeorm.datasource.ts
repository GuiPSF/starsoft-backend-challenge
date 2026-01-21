import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Session } from '../../modules/sessions/entities/session.entity';
import { Seat } from '../../modules/sessions/entities/seat.entity';
import { Reservation } from '../../modules/reservations/entities/reservation.entity';
import { Sale } from '../../modules/sales/entities/sale.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER ?? 'cinema',
  password: process.env.DATABASE_PASSWORD ?? 'cinema',
  database: process.env.DATABASE_NAME ?? 'cinema',
  entities: [Session, Seat, Reservation, Sale],
  migrations: ['src/infra/database/migrations/*.ts'],
});
