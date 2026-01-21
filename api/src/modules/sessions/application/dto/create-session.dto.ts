import { IsInt, IsISO8601, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  movie: string;

  // ISO8601: "2026-01-21T20:00:00-03:00"
  @IsISO8601()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  room: string;

  @IsInt()
  @Min(1)
  priceCents: number;

  @IsInt()
  @Min(16)
  @IsOptional()
  seatCount?: number; // default 16
}
