import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../entities/sale.entity';
import { PurchaseDto } from './dto/purchase.dto';

@Injectable()
export class ListUserPurchasesUseCase {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,
  ) {}

  async execute(userId: string): Promise<PurchaseDto[]> {
    const sales = await this.saleRepo.find({
      where: { userId },
      order: { soldAt: 'DESC' },
    });

    return sales.map((s) => ({
      saleId: s.id,
      reservationId: s.reservationId,
      sessionId: s.sessionId,
      userId: s.userId,
      totalPaidCents: s.totalPaidCents,
      paymentRef: s.paymentRef,
      soldAt: s.soldAt.toISOString(),
}));
  }
}
