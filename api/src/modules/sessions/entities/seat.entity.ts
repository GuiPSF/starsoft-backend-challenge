import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { Session } from './session.entity';

export type SeatStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';

@Entity({ name: 'seats' })
@Index(['sessionId', 'number'], { unique: true })
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Número do assento (1..N)
  @Column({ type: 'int' })
  number: number;

  @Column({ type: 'varchar', length: 10, default: 'AVAILABLE' })
  status: SeatStatus;

  @Column({ type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => Session, (session) => session.seats, { onDelete: 'CASCADE' })
  session: Session;
}
