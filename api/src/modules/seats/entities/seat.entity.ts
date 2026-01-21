import { Entity, PrimaryGeneratedColumn, Column, VersionColumn, OneToMany } from 'typeorm';

@Entity('seats')
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  row: string;

  @Column()
  number: number;

  @Column({
    type: 'enum',
    enum: ['AVAILABLE', 'RESERVED', 'SOLD'],
    default: 'AVAILABLE',
  })
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';

  @VersionColumn() // Mecanismo de Optimistic Locking
  version: number;
}