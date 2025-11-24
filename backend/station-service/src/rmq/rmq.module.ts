import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RmqService } from './rmq.service';

interface RmqModuleOptions {
  name: string;
}

@Module({
  providers: [RmqService],
  exports: [RmqService],
})
export class RmqModule {
  static register({ name }: RmqModuleOptions): DynamicModule {
    return {
      module: RmqModule,
      imports: [
        ClientsModule.registerAsync([
          {
            name,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
              const url = configService.getOrThrow<string>('RABBITMQ_URL');
              const queue = configService.getOrThrow<string>(`RABBITMQ_${name}_QUEUE`);
              const exchange = configService.getOrThrow<string>('EXCHANGE_NAME');

              return {
                transport: Transport.RMQ,
                options: {
                  urls: [url],
                  queue,
                  exchange: exchange,
                  exchangeType: 'direct'
                },
              };
            },
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }
}
