import { ApiProperty } from '@nestjs/swagger';

export class PurchaseDto {
  @ApiProperty({ example: '2c7acb2e-1c3f-4a3a-9c9e-0cfa9c72b1f2' })
  saleId: string;

  @ApiProperty({ example: '1e59580d-9ffa-4a02-b999-dabbac02d259' })
  reservationId: string;

  @ApiProperty({ example: 'f0d59876-138c-4eee-a382-14742c5634a9' })
  sessionId: string;

  @ApiProperty({ example: '50ed9531-4b57-4670-8ae8-d8a72717ccb3' })
  userId: string;

  @ApiProperty({ example: 5000 })
  totalPaidCents: number;

  @ApiProperty({ example: 'PAYMENT-TEST-123', nullable: true })
  paymentRef: string | null;

  @ApiProperty({ example: '2026-01-21T09:00:00.000Z' })
  soldAt: string;
}
