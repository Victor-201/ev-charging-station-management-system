import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RmqContext, RmqOptions, Transport } from '@nestjs/microservices';

@Injectable()
export class RmqService {
  constructor(private readonly configService: ConfigService) {}

  getOptions(queue: string, noAck = false): RmqOptions {
    const url = this.configService.get<string>('RABBITMQ_URL');
    const queueName = this.configService.get<string>(`RABBIT_MQ_${queue}_QUEUE`);

    if (!url) {
      throw new Error('Missing environment variable: RABBITMQ_URL');
    }

    if (!queueName) {
      throw new Error(`Missing environment variable: RABBIT_MQ_${queue}_QUEUE`);
    }

    return {
      transport: Transport.RMQ,
      options: {
        urls: [url],
        queue: queueName,
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