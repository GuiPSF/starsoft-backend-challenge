import { ApiProperty } from '@nestjs/swagger';
import { SeatStatus } from '../../entities/seat.entity';

export class SeatAvailabilityDto {
  @ApiProperty({ example: '69746336-80ca-42b1-8ccc-a8017aa541ae' })
  id: string;

  @ApiProperty({ example: 1 })
  number: number;

  @ApiProperty({ enum: SeatStatus, example: SeatStatus.AVAILABLE })
  status: SeatStatus;
}
