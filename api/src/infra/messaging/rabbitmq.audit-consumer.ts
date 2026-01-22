import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { logger } from '../logger/logger';


@Injectable()
export class RabbitAuditConsumer implements OnModuleInit, OnModuleDestroy {
  private conn?: amqp.Connection;
  private channel?: amqp.Channel;

  async onModuleInit() {
    const url = process.env.RABBITMQ_URL ?? 'amqp://rabbitmq:5672';
    this.conn = await amqp.connect(url);
    this.channel = await this.conn.createChannel();

    const exchange = 'cinema.events';
    const queue = 'cinema.audit';

    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(queue, exchange, '#');

    await this.channel.prefetch(10);

    await this.channel.consume(queue, async (msg) => {
      if (!msg) return;

        try {
            const routingKey = msg.fields.routingKey;
            const payload = JSON.parse(msg.content.toString());

            logger.info(
                { event: routingKey, payload },
                'rabbit_event_received',
        );

            this.channel!.ack(msg);
        } catch (err) {
            logger.error(
                { err, raw: msg.content.toString() },
                'rabbit_event_failed',
        );

            this.channel!.nack(msg, false, true);
        }

    });
  }

  async onModuleDestroy() {
    await this.channel?.close().catch(() => undefined);
    await this.conn?.close().catch(() => undefined);
  }
}
