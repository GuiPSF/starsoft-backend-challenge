import { ConfirmPaymentUseCase } from './confirm-payment.usecase';

describe('ConfirmPaymentUseCase (unit)', () => {
  const publisher = { publish: jest.fn() };
  const idempo = { get: jest.fn(), set: jest.fn() };

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

  it('should return cached response when Idempotency-Key is repeated', async () => {
    const useCase = new ConfirmPaymentUseCase(dataSource as any, publisher as any, idempo as any);

    idempo.get.mockResolvedValue({ reservationId: 'res-1', status: 'CONFIRMED' });

    const res = await useCase.execute('res-1', 'PAY', 'KEY-1');

    expect(res).toEqual({ reservationId: 'res-1', status: 'CONFIRMED' });
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(publisher.publish).not.toHaveBeenCalled();
  });
});
