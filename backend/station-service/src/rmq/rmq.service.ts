import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RmqContext, RmqOptions, Transport } from '@nestjs/microservices';
import { ROUTING_KEY } from './rmq.constants';

@Injectable()
export class RmqService {
  constructor(private readonly configService: ConfigService) {}

  getOptions(queue: string, noAck = false, routingKey: string): RmqOptions {
    const url = this.configService.get<string>('RABBITMQ_URL');
    const queueName = this.configService.get<string>(`RABBITMQ_${queue}_QUEUE`);
    const exchange = this.configService.get<string>('EXCHANGE_NAME');

    if (!url) {
      throw new Error('Missing environment variable: RABBITMQ_URL');
    }

    if (!queueName) {
      throw new Error(`Missing environment variable: RABBITMQ_${queue}_QUEUE`);
    }

    return {
      transport: Transport.RMQ,
      options: {
        urls: [url],
        queue: queueName,
        exchange,
        exchangeType: 'direct',
        routingKey: routingKey,
        noAck,
        persistent: true,
      },
    };
  }

  ack(context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    channel.ack(originalMessage);
  }
}