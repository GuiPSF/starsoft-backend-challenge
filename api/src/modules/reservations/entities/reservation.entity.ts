import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Seat } from '../../sessions/entities/seat.entity';
import { ReservationStatus } from './reservation-status';

@Entity({ name: 'reservations' })
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sessionId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'varchar', length: 10, default: 'PENDING' })
  status: ReservationStatus;

  @ManyToMany(() => Seat)
  @JoinTable({
    name: 'reservation_seats',
    joinColumn: { name: 'reservation_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'seat_id', referencedColumnName: 'id' },
  })
  seats: Seat[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
