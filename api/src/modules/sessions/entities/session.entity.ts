import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Seat } from './seat.entity';

@Entity({ name: 'sessions' })
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  movie: string;

  // Pode ser timestamp com timezone (recomendado)
  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'varchar', length: 100 })
  room: string;

  // Use centavos pra evitar float (ex: 2590 = R$25,90)
  @Column({ type: 'int' })
  priceCents: number;

  @OneToMany(() => Seat, (seat) => seat.session, { cascade: true })
  seats: Seat[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
