import { IsOptional, IsNumberString, IsString, IsNumber, ValidateNested, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchStationDto {
    @IsNumberString()
    lat: number;

    @IsNumberString()
    lng: number;

    @IsNumberString()
    radius: number;

    @IsOptional()
    @IsString()
    connector_type?: string;

    @IsOptional()
    @IsNumberString()
    power_min?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsNumberString()
    page?: string;

    @IsOptional()
    @IsNumberString()
    size?: string;
}

class LocationDto {
    @IsNumber()
    lat: number;

    @IsNumber()
    lng: number;
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
    @IsString()
    status?: string;

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
    @IsString()
    status?: string;
}

export class ConnectorDto {
    connector_id: string;
    type: string;
    max_power_kw: number;
    status: string;
}

export class ReportIssueDto {
    @IsString()
    connector_id: string;

    @IsOptional()
    @IsString()
    severity?: string;

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
    model: 'per_kwh' | 'per_min' | 'flat';
    price: number;
    currency: string;
}

export class StationPricingDto {
    pricing: PricingItemDto[];
}