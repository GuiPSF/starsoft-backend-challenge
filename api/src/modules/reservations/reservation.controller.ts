import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateReservationDto } from './application/dto/create-reservation.dto';
import { ConfirmPaymentDto } from './application/dto/confirm-payment.dto';
import { CreateReservationUseCase } from './application/create-reservation.usecase';
import { ConfirmPaymentUseCase } from './application/confirm-payment.usecase';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationController {
  constructor(
    private readonly createReservation: CreateReservationUseCase,
    private readonly confirmPayment: ConfirmPaymentUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Reserve seats (TTL 30s)' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Optional key to safely retry this request without duplicating reservations',
  })
  @ApiOkResponse({ description: 'Reservation created' })
  create(
    @Body() dto: CreateReservationDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.createReservation.execute(dto, idempotencyKey);
  }

  @Post(':id/confirm-payment')
  @ApiOperation({ summary: 'Confirm payment and finalize reservation into sale' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Optional key to safely retry payment confirmation without double-processing',
  })
  @ApiOkResponse({ description: 'Payment confirmed' })
  confirm(
    @Param('id') reservationId: string,
    @Body() dto: ConfirmPaymentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.confirmPayment.execute(reservationId, dto.paymentRef, idempotencyKey);
  }
}
