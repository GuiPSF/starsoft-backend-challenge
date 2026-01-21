import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'sales' })
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  reservationId: string; // 1 venda por reserva

  @Column({ type: 'uuid' })
  sessionId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'int' })
  totalPaidCents: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentRef: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  soldAt: Date;
}
