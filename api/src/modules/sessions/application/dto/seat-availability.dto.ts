import { ApiProperty } from '@nestjs/swagger';

export enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
}

export class SeatAvailabilityDto {
  @ApiProperty({ example: '69746336-80ca-42b1-8ccc-a8017aa541ae' })
  id: string;

  @ApiProperty({ example: 1 })
  number: number;

  @ApiProperty({ enum: SeatStatus, example: SeatStatus.AVAILABLE })
  status: SeatStatus;
}
