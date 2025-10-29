import { Module  } from '@nestjs/common';
import { RabbitMQService } from './rmq.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [RabbitMQService],
})
export class rmqModule {}
