import { ConflictException } from '@nestjs/common';
import { ConfirmPaymentUseCase } from './confirm-payment.usecase';

describe('ConfirmPaymentUseCase (unit)', () => {
  const publisher = { publish: jest.fn() };

  const manager = {
    createQueryBuilder: jest.fn(),
    update: jest.fn(),
    query: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const dataSource = {
    transaction: jest.fn(async (cb: any) => cb(manager)),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be idempotent when reservation is already CONFIRMED (no extra publish needed)', async () => {
    const useCase = new ConfirmPaymentUseCase(dataSource as any, publisher as any);

    // mock querybuilder to return confirmed reservation
    const qb = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        id: 'res-1',
        status: 'CONFIRMED',
        sessionId: 'sess-1',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 60_000),
      }),
    };
    manager.createQueryBuilder.mockReturnValue(qb);

    const result = await useCase.execute('res-1', 'PAY-1');

    expect(result.status).toBe('CONFIRMED');
  });

  it('should throw ConflictException when reservation is EXPIRED', async () => {
    const useCase = new ConfirmPaymentUseCase(dataSource as any, publisher as any);

    const qb = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        id: 'res-1',
        status: 'EXPIRED',
        sessionId: 'sess-1',
        userId: 'user-1',
        expiresAt: new Date(Date.now() - 60_000),
      }),
    };
    manager.createQueryBuilder.mockReturnValue(qb);

    await expect(useCase.execute('res-1', 'PAY-1')).rejects.toBeInstanceOf(ConflictException);
  });
});
