import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { logger } from '../logger/logger';

type RetryDelayMs = 1000 | 5000 | 15000;

@Injectable()
export class RabbitAuditConsumer implements OnModuleInit, OnModuleDestroy {
  private conn?: amqp.Connection;
  private channel?: amqp.Channel;

  private readonly BATCH_SIZE = 20;
  private readonly FLUSH_INTERVAL_MS = 1000;

  private buffer: amqp.ConsumeMessage[] = [];
  private flushTimer?: NodeJS.Timeout;
  private flushing = false;

  private readonly EVENTS_EXCHANGE = 'cinema.events';
  private readonly AUDIT_QUEUE = 'cinema.audit';

  private readonly DLX_EXCHANGE = 'cinema.dlx';
  private readonly DLQ_QUEUE = 'cinema.audit.dlq';
  private readonly DLQ_ROUTING_KEY = 'audit.failed';

  private readonly RETRY_EXCHANGE = 'cinema.retry';
  private readonly RETRY_DELAYS: RetryDelayMs[] = [1000, 5000, 15000];

  async onModuleInit() {
    const url = process.env.RABBITMQ_URL ?? 'amqp://rabbitmq:5672';
    this.conn = await amqp.connect(url);
    this.channel = await this.conn.createChannel();

    await this.setupTopology();

    await this.channel.prefetch(50);

    this.flushTimer = setInterval(() => {
      void this.flush();
    }, this.FLUSH_INTERVAL_MS);

    this.flushTimer.unref?.();

    await this.channel.consume(this.AUDIT_QUEUE, async (msg) => {
      if (!msg) return;

      this.buffer.push(msg);

      if (this.buffer.length >= this.BATCH_SIZE) {
        await this.flush();
      }
    });

    logger.info(
      {
        queue: this.AUDIT_QUEUE,
        dlq: this.DLQ_QUEUE,
        retryDelays: this.RETRY_DELAYS,
        batchSize: this.BATCH_SIZE,
        flushIntervalMs: this.FLUSH_INTERVAL_MS,
      },
      'rabbit_audit_consumer_started',
    );
  }

  private async flush() {
    if (!this.channel) return;
    if (this.flushing) return;
    if (this.buffer.length === 0) return;

    this.flushing = true;

    const batch = this.buffer.splice(0, this.buffer.length);

    try {
      for (const msg of batch) {
        const routingKey = msg.fields.routingKey;
        const raw = msg.content.toString();

        try {
          const payload = JSON.parse(raw);

          logger.info({ event: routingKey, payload }, 'rabbit_event_received');

          this.channel.ack(msg);
        } catch (err) {
          await this.handleFailure(msg, err);
        }
      }

      logger.debug({ size: batch.length }, 'rabbit_batch_flushed');
    } finally {
      this.flushing = false;
    }
  }

  private async setupTopology() {
    if (!this.channel) throw new Error('RabbitMQ channel not initialized');

    await this.channel.assertExchange(this.EVENTS_EXCHANGE, 'topic', { durable: true });
    await this.channel.assertExchange(this.DLX_EXCHANGE, 'direct', { durable: true });
    await this.channel.assertExchange(this.RETRY_EXCHANGE, 'direct', { durable: true });

    await this.channel.assertQueue(this.DLQ_QUEUE, { durable: true });
    await this.channel.bindQueue(this.DLQ_QUEUE, this.DLX_EXCHANGE, this.DLQ_ROUTING_KEY);

    await this.channel.assertQueue(this.AUDIT_QUEUE, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': this.DLX_EXCHANGE,
        'x-dead-letter-routing-key': this.DLQ_ROUTING_KEY,
      },
    });

    await this.channel.bindQueue(this.AUDIT_QUEUE, this.EVENTS_EXCHANGE, '#');

    for (const delay of this.RETRY_DELAYS) {
      const retryQueueName = this.retryQueueName(delay);

      await this.channel.assertQueue(retryQueueName, {
        durable: true,
        arguments: {
          'x-message-ttl': delay,
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': this.AUDIT_QUEUE,
        },
      });

      await this.channel.bindQueue(retryQueueName, this.RETRY_EXCHANGE, String(delay));
    }
  }

  private retryQueueName(delay: RetryDelayMs) {
    return `cinema.audit.retry.${delay}`;
  }

  private getAttempts(msg: amqp.ConsumeMessage): number {
    const h = msg.properties.headers ?? {};
    const attempts = Number(h['x-attempts'] ?? 0);
    return Number.isFinite(attempts) ? attempts : 0;
  }

  private nextDelay(attempts: number): RetryDelayMs | null {
    if (attempts === 1) return 1000;
    if (attempts === 2) return 5000;
    if (attempts === 3) return 15000;
    return null;
  }

  private async handleFailure(msg: amqp.ConsumeMessage, err: unknown) {
    if (!this.channel) return;

    const routingKey = msg.fields.routingKey;
    const raw = msg.content.toString();

    const attempts = this.getAttempts(msg) + 1;
    const delay = this.nextDelay(attempts);

    logger.warn(
      { event: routingKey, attempts, delay, err: String(err) },
      'rabbit_event_processing_failed',
    );

    if (delay) {
      const headers = {
        ...(msg.properties.headers ?? {}),
        'x-attempts': attempts,
        'x-original-routing-key': routingKey,
      };

      this.channel.publish(this.RETRY_EXCHANGE, String(delay), msg.content, {
        persistent: true,
        contentType: msg.properties.contentType ?? 'application/json',
        headers,
      });

      this.channel.ack(msg);

      logger.info({ event: routingKey, attempts, delay }, 'rabbit_event_scheduled_for_retry');
      return;
    }

    this.channel.nack(msg, false, false);

    logger.error({ event: routingKey, attempts, raw }, 'rabbit_event_sent_to_dlq');
  }

  async onModuleDestroy() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    await this.channel?.close().catch(() => undefined);
    await this.conn?.close().catch(() => undefined);
  }
}
