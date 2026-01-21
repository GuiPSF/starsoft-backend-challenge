import { Body, Controller, Post } from '@nestjs/common';
import { CreateReservationDto } from './application/dto/create-reservation.dto';
import { CreateReservationUseCase } from './application/create-reservation.usecase';

@Controller('reservations')
export class ReservationController {
  constructor(private readonly createReservation: CreateReservationUseCase) {}

  @Post()
  create(@Body() dto: CreateReservationDto) {
    return this.createReservation.execute(dto);
  }
}
