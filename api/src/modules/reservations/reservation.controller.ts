import { Body, Controller, Param, Post } from '@nestjs/common';
import { CreateReservationDto } from './application/dto/create-reservation.dto';
import { CreateReservationUseCase } from './application/create-reservation.usecase';
import { ConfirmPaymentDto } from './application/dto/confirm-payment.dto';
import { ConfirmPaymentUseCase } from './application/confirm-payment.usecase';

@Controller('reservations')
export class ReservationController {
  constructor(
    private readonly createReservation: CreateReservationUseCase,
    private readonly confirmPayment: ConfirmPaymentUseCase,
  ) {}

  @Post()
  create(@Body() dto: CreateReservationDto) {
    return this.createReservation.execute(dto);
  }

  @Post(':id/confirm-payment')
  confirm(@Param('id') id: string, @Body() dto: ConfirmPaymentDto) {
    return this.confirmPayment.execute(id, dto.paymentRef);
  }
}
