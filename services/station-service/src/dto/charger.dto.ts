import { IsString, IsNumberString, IsIn, } from 'class-validator';

export class RegisterChargerDto {
  @IsString()
  external_id: string;

  @IsString()
  station_id: string;

  @IsString()
  connector_type: string;

  @IsNumberString()
  price_per_kwh: string;

  @IsNumberString()
  price_per_minute: string;

  @IsNumberString()
  max_power_kw: string;
}

export class ChargerDetailDto {
  charger_id: string;
  external_id: string;
  status: string;
}

export class ChargerHealthDto {
  charger_id: string;
  health: string;
  errors: string[];
}

export class UpdateFirmwareDto {
  @IsString()
  version: string;

  @IsString()
  url: string;
}

export class ControlChargerDto {
 @IsIn(['lock', 'unlock', 'enable', 'disable', 'reset'])
  action: string;
}

export class ChargerPricingItemDto {
  model: 'per_kwh' | 'per_min' | 'flat';
  price: number;
  currency: string;
}

export class ChargerPricingResponseDto {
  pricing: ChargerPricingItemDto[];
}

