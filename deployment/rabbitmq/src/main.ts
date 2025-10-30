import { NestFactory } from '@nestjs/core';
import { rmqModule } from './rmq.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(rmqModule);
  console.log('RMQ Service is running...');
}
bootstrap();
