import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ example: 'f0d59876-138c-4eee-a382-14742c5634a9' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ example: '50ed9531-4b57-4670-8ae8-d8a72717ccb3' })
  @IsUUID()
  userId: string;

  @ApiProperty({
    example: [
      '69746336-80ca-42b1-8ccc-a8017aa541ae',
      'f90f339a-8998-42b2-83b6-111b5fa48c86',
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  seatIds: string[];
}
