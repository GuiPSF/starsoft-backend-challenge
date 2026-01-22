import * as request from 'supertest';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

function getSessionId(body: any): string {
  // adapta para variações de retorno
  return (
    body?.id ??
    body?.sessionId ??
    body?.session?.id ??
    body?.data?.id
  );
}

describe('Concurrency (E2E) - Reservations', () => {
  it('should allow only ONE reservation for the same seat under concurrency', async () => {
    // 1) Create session
    const createSessionRes = await request(BASE_URL)
      .post('/sessions')
      .send({
        movie: 'Concurrency Test Movie',
        startTime: new Date(Date.now() + 60_000).toISOString(),
        room: 'Sala Concurrency',
        priceCents: 1000,
        seatCount: 16,
      })
      .expect(201);

    const sessionId = getSessionId(createSessionRes.body);
    expect(sessionId).toBeTruthy();

    // 2) Get seats
    const seatsRes = await request(BASE_URL)
      .get(`/sessions/${sessionId}/seats`)
      .expect(200);

    expect(Array.isArray(seatsRes.body)).toBe(true);
    expect(seatsRes.body.length).toBeGreaterThanOrEqual(1);

    const seatId = seatsRes.body[0].id;
    expect(seatId).toBeTruthy();

    // 3) Fire 10 concurrent reservation requests for the SAME seat
    const payload = {
      sessionId,
      userId: '50ed9531-4b57-4670-8ae8-d8a72717ccb3',
      seatIds: [seatId],
    };

    const attempts = 10;

    const results = await Promise.allSettled(
      Array.from({ length: attempts }, () =>
        request(BASE_URL).post('/reservations').send(payload),
      ),
    );

    const statusCodes = results.map((r) =>
      r.status === 'fulfilled' ? r.value.status : 0,
    );

    // Consider "success" as 201 or 200 (depende do controller)
    const successCount = statusCodes.filter((s) => s === 201 || s === 200).length;

    // "failure" should be conflict 409 (or 429 if rate limit ever triggers)
    const conflictOrLimitCount = statusCodes.filter((s) => s === 409 || s === 429).length;

    // Assertions:
    expect(successCount).toBe(1);
    expect(conflictOrLimitCount).toBeGreaterThanOrEqual(attempts - 1);

    // Optional: ensure seat is RESERVED after the successful reservation (immediate check)
    const seatsResAfter = await request(BASE_URL)
      .get(`/sessions/${sessionId}/seats`)
      .expect(200);

    const seatAfter = seatsResAfter.body.find((s: any) => s.id === seatId);
    expect(seatAfter).toBeTruthy();
    expect(['RESERVED', 'SOLD']).toContain(seatAfter.status);
  });
});
