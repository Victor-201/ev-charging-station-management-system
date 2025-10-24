import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { StationModule } from './station/station.module';
import { ChargerModule } from './charger/charger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    StationModule,
    // ChargerModule,
  ],
  // controllers: [AppController],
  // providers: [AppService],
})
export class AppModule {}
