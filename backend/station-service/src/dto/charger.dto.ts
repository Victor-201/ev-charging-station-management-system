import { IsString, IsNumberString, IsIn, IsEnum} from 'class-validator';

export class RegisterChargerDto {
  @IsString()
  external_id: string;

  @IsString()
  name: string;

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
  point_id: string;
  name: string;
  external_id: string;
  status: string;
  created_at: Date
}

export class ChargerHealthDto {
  point_id: string;
  health: string;
  errors: string[];
}

export class UpdateFirmwareDto {
  @IsString()
  version: string;

  @IsString()
  url: string;
}

export enum ChargerStatus {
    available = 'available',
    in_use = 'in_use',
    offline = 'offline',
    faulted = 'faulted',
    reserved = 'reserved'
}

export class ControlChargerDto {
  @IsEnum(ChargerStatus)
  status: ChargerStatus
}

export class ChargerPricingItemDto {
  model: 'per_kwh' | 'per_minute';
  price: number;
  currency: string;
}

export class ChargerPricingResponseDto {
  pricing: ChargerPricingItemDto[];
}