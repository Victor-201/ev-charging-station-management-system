import { IsOptional, IsNumberString, IsString, IsNumber, ValidateNested, IsISO8601, IsEnum, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';

export enum StationStatus {
    active = 'active',
    inactive = 'inactive',
    maintenance = 'maintenance',
    closed = 'closed',
}

export class SearchStationDto {
    @IsNumberString()
    latitude: number;

    @IsNumberString()
    longitude: number;

    @IsNumberString()
    radius: number;

    @IsOptional()
    @IsString()
    connector_type?: string;

    @IsOptional()
    @IsNumberString()
    power_min?: string;

    @IsOptional()
    @IsEnum(StationStatus)
    status?: StationStatus;

    @IsOptional()
    @IsNumberString()
    page?: string;

    @IsOptional()
    @IsNumberString()
    size?: string;
}

class LocationDto {
    @IsNumber()
    latitude: number;

    @IsNumber()
    longitude: number;
}


export class CreateStationDto {
    @IsString()
    name: string;

    @IsString()
    address: string;

    @IsString()
    city: string;

    @IsString()
    region: string;

    @IsOptional()
    @IsEnum(StationStatus)
    status?: StationStatus;

    @ValidateNested()
    @Type(() => LocationDto)
    location: LocationDto;
}


export class UpdateStationDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    region?: string;

    @IsOptional()
    @IsEnum(StationStatus)
    status?: StationStatus;

    @IsOptional()
    @IsDecimal()
    latitude?: number;

    @IsOptional()
    @IsDecimal()
    longitude?: number;
}

export class ConnectorDto {
    point_id: string;
    type: string;
    max_power_kw: number;
    status: string;
}

enum StationSeverity {
    low = 'low',
    medium = 'medium',
    high = 'high',
    critical = 'critical',
}

export class ReportIssueDto {
    @IsString()
    connector_id: string;

    @IsEnum(StationSeverity)
    @IsOptional()
    @IsString()
    severity?: StationSeverity;

    @IsString()
    description: string;
}


export class ScheduleMaintenanceDto {
    @IsString()
    reason: string;

    @IsISO8601()
    start: string;

    @IsISO8601()
    end: string;
}

export class PricingItemDto {
    point_id: string;
    model: 'per_kwh' | 'per_minute';
    price: number;
    currency: string;
}

export class StationPricingDto {
    pricing: PricingItemDto[];
}

export class GetListOfStation {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    region: string | null;
    latitude: number | undefined;
    longitude: number | undefined;
    status: StationStatus;
}

export class UpdataStatusDto {
    @IsEnum(StationStatus)
    status: StationStatus;
}

export class StationAbilityItemDto {
    @IsString()
    station_id: string;

    @IsISO8601()
    start: string;

    @IsISO8601()
    end: string;

    @IsOptional()
    @IsString()
    connector_type?: string;
}

export class StationAvailabilityPointDto {
    point_id: string;
    start: string;
    end: string;
}

export class StationAbilityDto {
    availability: StationAvailabilityPointDto[];
}