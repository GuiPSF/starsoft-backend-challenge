import { BadRequestException, ConflictException } from '@nestjs/common';
import { CreateReservationUseCase } from './create-reservation.usecase';

describe('CreateReservationUseCase (unit)', () => {
  const publisher = { publish: jest.fn() };
  const redis = { client: { set: jest.fn() } };
  const idempo = { get: jest.fn(), set: jest.fn() };

  const manager = {
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const dataSource = {
    transaction: jest.fn(async (cb: any) => cb(manager)),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return cached response when Idempotency-Key is repeated', async () => {
    const useCase = new CreateReservationUseCase(
      dataSource as any,
      publisher as any,
      redis as any,
      idempo as any,
    );

    idempo.get.mockResolvedValue({ reservationId: 'res-cached', expiresAt: 'X' });

    const res = await useCase.execute(
      { sessionId: 's', userId: 'u', seatIds: ['a'] } as any,
      'KEY-1',
    );

    expect(res).toEqual({ reservationId: 'res-cached', expiresAt: 'X' });
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when seatIds contains duplicates', async () => {
    const useCase = new CreateReservationUseCase(
      dataSource as any,
      publisher as any,
      redis as any,
      idempo as any,
    );

    await expect(
      useCase.execute(
        { sessionId: 's', userId: 'u', seatIds: ['a', 'a'] } as any,
        undefined,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw ConflictException when some seat is not AVAILABLE', async () => {
    const useCase = new CreateReservationUseCase(
      dataSource as any,
      publisher as any,
      redis as any,
      idempo as any,
    );

    idempo.get.mockResolvedValue(null);

    manager.find.mockResolvedValue([{ id: 'seat-1', status: 'SOLD' }]);

    await expect(
      useCase.execute({ sessionId: 's', userId: 'u', seatIds: ['seat-1'] } as any, undefined),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
