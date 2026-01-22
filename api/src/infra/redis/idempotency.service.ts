import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class IdempotencyService {
  constructor(private readonly redis: RedisService) {}

  private buildKey(namespace: string, key: string) {
    return `idempo:${namespace}:${key}`;
  }

  async get<T>(namespace: string, idempotencyKey: string): Promise<T | null> {
    const raw = await this.redis.client.get(this.buildKey(namespace, idempotencyKey));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  }

  async set<T>(
    namespace: string,
    idempotencyKey: string,
    value: T,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redis.client.set(
      this.buildKey(namespace, idempotencyKey),
      JSON.stringify(value),
      'EX',
      ttlSeconds,
    );
  }
}
