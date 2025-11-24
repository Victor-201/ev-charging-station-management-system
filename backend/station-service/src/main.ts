import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RmqService } from './rmq/rmq.service';
import { ROUTING_KEY } from './rmq/rmq.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const rmqService = app.get(RmqService);

  const queues = ['CHARGER', 'SESSION'];
  

  queues.forEach(queue => {
    const routingKeys = ROUTING_KEY[queue];
    routingKeys.forEach((rk : string) => {
      app.connectMicroservice(rmqService.getOptions(queue, false, rk));
    });
  });

  await app.startAllMicroservices();
  
  app.setGlobalPrefix('api/v1');
  await app.listen(process.env.PORT ?? 3000);

  console.log('Station service started on port', process.env.PORT ?? 3000);
}
bootstrap();