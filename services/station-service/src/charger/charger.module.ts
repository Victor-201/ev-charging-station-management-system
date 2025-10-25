import { Module } from '@nestjs/common';
import { ChargerController } from './charger.controller';
import { ChargerService } from './charger.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [ChargerController],
  providers: [ChargerService, PrismaService]
})
export class ChargerModule {}
