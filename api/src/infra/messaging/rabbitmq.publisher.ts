import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitPublisher implements OnModuleDestroy {
  private conn?: amqp.Connection;
  private channel?: amqp.Channel;

  async onModuleDestroy() {
    await this.channel?.close().catch(() => undefined);
    await this.conn?.close().catch(() => undefined);
  }

  private async ensure() {
    if (this.channel) return;

    const url = process.env.RABBITMQ_URL ?? 'amqp://rabbitmq:5672';
    this.conn = await amqp.connect(url);
    this.channel = await this.conn.createChannel();

    await this.channel.assertExchange('cinema.events', 'topic', { durable: true });
  }

  async publish(routingKey: string, payload: unknown) {
    await this.ensure();
    const msg = Buffer.from(JSON.stringify(payload));
    this.channel!.publish('cinema.events', routingKey, msg, { persistent: true });
  }
}
