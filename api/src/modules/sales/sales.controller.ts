import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PurchaseDto } from './application/dto/purchase.dto';
import { ListUserPurchasesUseCase } from './application/list-user-purchases.usecase';

@ApiTags('Sales')
@Controller()
export class SalesController {
  constructor(private readonly listPurchases: ListUserPurchasesUseCase) {}

  @Get('users/:userId/purchases')
  @ApiOperation({ summary: 'List purchase history for a user' })
  @ApiOkResponse({ type: PurchaseDto, isArray: true })
  list(@Param('userId') userId: string) {
    return this.listPurchases.execute(userId);
  }
}
