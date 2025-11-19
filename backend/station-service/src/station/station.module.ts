import { Module } from '@nestjs/common';
import { StationController } from './station.controller';
import { StationService } from './station.service';
import { PrismaService } from 'src/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { RmqModule } from 'src/rmq/rmq.module';

@Module({
  imports: [
    ConfigModule, 
    RmqModule.register({ name: 'STATION' }), 
    RmqModule.register({ name: 'CHARGER' })
  ],
  controllers: [StationController],
  providers: [StationService, PrismaService]
})
export class StationModule {}
