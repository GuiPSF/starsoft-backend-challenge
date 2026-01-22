import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create a seat reservation (30s TTL)' })
  @ApiCreatedResponse({ description: 'Reservation created' })
  @ApiConflictResponse({ description: 'Seats unavailable' })
  create(@Body() dto: CreateReservationDto) {
    return this.createReservation.execute(dto);
  }

  @Post(':id/confirm-payment')
  @ApiOperation({ summary: 'Confirm payment and finalize sale' })
  @ApiOkResponse({ description: 'Payment confirmed' })
  confirm(
    @Param('id') reservationId: string,
    @Body() dto: ConfirmPaymentDto,
  ) {
    return this.confirmPayment.execute(reservationId, dto.paymentRef);
  }
}
