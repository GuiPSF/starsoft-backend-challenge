import { Controller, Get, Param } from '@nestjs/common';
import { ListUserPurchasesUseCase } from './application/list-user-purchases.usecase';

@Controller()
export class SalesController {
  constructor(private readonly listUserPurchases: ListUserPurchasesUseCase) {}

  @Get('users/:userId/purchases')
  list(@Param('userId') userId: string) {
    return this.listUserPurchases.execute(userId);
  }
}
