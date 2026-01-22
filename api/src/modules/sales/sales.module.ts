import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './entities/sale.entity';
import { SalesController } from './sales.controller';
import { ListUserPurchasesUseCase } from './application/list-user-purchases.usecase';

@Module({
  imports: [TypeOrmModule.forFeature([Sale])],
  controllers: [SalesController],
  providers: [ListUserPurchasesUseCase],
})
export class SalesModule {}
