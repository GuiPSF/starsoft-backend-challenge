import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsISO8601, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({ example: 'Duna 2' })
  @IsString()
  @IsNotEmpty()
  movie: string;

  @ApiProperty({ example: '2026-01-21T20:00:00-03:00' })
  @IsISO8601()
  startTime: string;

  @ApiProperty({ example: 'Sala 1' })
  @IsString()
  @IsNotEmpty()
  room: string;

  @ApiProperty({ example: 2500, description: 'Price in cents' })
  @IsInt()
  @Min(1)
  priceCents: number;

  @ApiPropertyOptional({ example: 16, minimum: 16 })
  @IsOptional()
  @IsInt()
  @Min(16)
  seatCount?: number;
}
