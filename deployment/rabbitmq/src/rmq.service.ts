import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { Channel, Connection } from 'amqplib';
import { RMQ_QUEUES, RMQ_ROUTING_KEYS } from './rabbit.constants';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private connection!: Connection;
  private channel!: Channel;


  constructor(private readonly configService: ConfigService) { }

  async onModuleInit() {
    await this.connect();
    await this.setup();
  }

  private async connect(): Promise<void> {
    const rmqUrl = this.configService.get<string>('RABBITMQ_URL');
    if (!rmqUrl) {
      throw new Error('RABBITMQ_URL is not defined in environment variables');
    }

    const connection: Connection = await amqp.connect(rmqUrl);
    this.connection = connection;
    const channel: Channel = await this.connection.createChannel();
    this.channel = channel;

    console.log('Connected to RabbitMQ');
  }

  private async setup(): Promise<void> {
    const RMQ_EXCHANGE =
      this.configService.get<string>('EXCHANGE_NAME') ||
      'ev_charging_exchange';

    await this.channel.assertExchange(RMQ_EXCHANGE, 'topic', { durable: true });

    const bindings = [
      { queue: RMQ_QUEUES.CHARGER, key: RMQ_ROUTING_KEYS.CHARGER },
      { queue: RMQ_QUEUES.STATION, key: RMQ_ROUTING_KEYS.STATION },
    ];

    for (const b of bindings) {
      await this.channel.assertQueue(b.queue, { durable: true });
      await this.channel.bindQueue(b.queue, RMQ_EXCHANGE, b.key);
      console.log(`Queue "${b.queue}" bound using key "${b.key}"`);
    }

    console.log('All queues and routing key have been setup successfully!');
  }

  getChannel(): amqp.Channel {
    return this.channel;
  }
}