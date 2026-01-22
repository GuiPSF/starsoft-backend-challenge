import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ConfirmPaymentDto {
  @ApiPropertyOptional({
    example: 'PAYMENT-TEST-123',
    description: 'External payment reference',
  })
  @IsOptional()
  @IsString()
  paymentRef?: string;
}
