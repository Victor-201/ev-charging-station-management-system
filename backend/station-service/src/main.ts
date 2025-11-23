import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RmqService } from './rmq/rmq.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const rmqService = app.get(RmqService);

  const queues = ['CHARGER', 'SESSION'];

  queues.forEach(queue => {
    app.connectMicroservice(rmqService.getOptions(queue));
  });

  await app.startAllMicroservices();
  
  app.setGlobalPrefix('api/v1');
  await app.listen(process.env.PORT ?? 3000);

  console.log('Station service started on port', process.env.PORT ?? 3000);
}
bootstrap();