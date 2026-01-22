import { ConflictException, BadRequestException } from '@nestjs/common';
import { CreateReservationUseCase } from './create-reservation.usecase';

describe('CreateReservationUseCase (unit)', () => {
  const publisher = { publish: jest.fn() };
  const redis = { client: { set: jest.fn() } };

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

  it('should throw BadRequestException when seatIds contains duplicates', async () => {
    const useCase = new CreateReservationUseCase(
      dataSource as any,
      publisher as any,
      redis as any,
    );

    await expect(
      useCase.execute({
        sessionId: 'f0d59876-138c-4eee-a382-14742c5634a9',
        userId: '50ed9531-4b57-4670-8ae8-d8a72717ccb3',
        seatIds: ['a', 'a'],
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should publish reservation.created and set redis ttl after successful reservation', async () => {
    const useCase = new CreateReservationUseCase(
      dataSource as any,
      publisher as any,
      redis as any,
    );

    // fake seats returned by manager.find with AVAILABLE status
    manager.find.mockResolvedValue([
      { id: 'seat-1', sessionId: 'sess-1', status: 'AVAILABLE' },
    ]);

    // manager.save for seats
    manager.save.mockImplementation(async (_entity: any, value: any) => value);

    // manager.create for Reservation
    manager.create.mockImplementation((_entity: any, value: any) => ({
      id: 'res-1',
      ...value,
    }));

    // manager.save for Reservation final
    manager.save.mockResolvedValue({
      id: 'res-1',
      sessionId: 'sess-1',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 30_000),
    });

    const result = await useCase.execute({
      sessionId: 'sess-1',
      userId: 'user-1',
      seatIds: ['seat-1'],
    } as any);

    expect(result.reservationId).toBe('res-1');

    expect(redis.client.set).toHaveBeenCalled();
    expect(publisher.publish).toHaveBeenCalledWith(
      'reservation.created',
      expect.objectContaining({
        reservationId: 'res-1',
        sessionId: 'sess-1',
        userId: 'user-1',
      }),
    );
  });

  it('should throw ConflictException when some seat is not AVAILABLE', async () => {
    const useCase = new CreateReservationUseCase(
      dataSource as any,
      publisher as any,
      redis as any,
    );

    manager.find.mockResolvedValue([
      { id: 'seat-1', sessionId: 'sess-1', status: 'SOLD' },
    ]);

    await expect(
      useCase.execute({
        sessionId: 'sess-1',
        userId: 'user-1',
        seatIds: ['seat-1'],
      } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
