import { Module } from '@nestjs/common';
import { ChargerController } from './charger.controller';
import { ChargerService } from './charger.service';

@Module({
  controllers: [ChargerController],
  providers: [ChargerService]
})
export class ChargerModule {}
