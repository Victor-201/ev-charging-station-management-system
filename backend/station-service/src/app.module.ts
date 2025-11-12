import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { StationModule } from './station/station.module';
import { ChargerModule } from './charger/charger.module';
// import { RmqConfigModule } from './rmq-config/rmq-config.module';
// import { RmqClientModule } from './rmq-client/rmq-client.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    StationModule,
    ChargerModule,
    // RmqConfigModule,
    // RmqClientModule,
  ],
  // controllers: [AppController],
  // providers: [AppService],
})
export class AppModule {}
