import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

import { RegisterChargerDto, ChargerDetailDto, ChargerHealthDto, UpdateFirmwareDto, ControlChargerDto, ChargerPricingResponseDto, ChargerPricingItemDto } from 'src/dto/charger.dto';

@Injectable()
export class ChargerService {
    constructor(private prisma: PrismaService) { }

    deviceRegistration = async (body: RegisterChargerDto): Promise<any> => {
        const existing = await this.prisma.charging_points.findUnique({
            where: { external_id: body.external_id },
        });
        if (existing) {
            throw new ConflictException('Charger with this external_id already exists');
        }

        const charger = await this.prisma.charging_points.create({
            data: {
                external_id: body.external_id,
                station_id: body.station_id,
                connector_type: body.connector_type,
                price_per_kwh: parseFloat(body.price_per_kwh),
                price_per_minute: parseFloat(body.price_per_minute),
                max_power_kw: parseFloat(body.max_power_kw),
            },
        });

        return { charger_id: charger.id, status: 'registered' }
    }

    detailOfChargingPoint = async (charger_id: string): Promise<ChargerDetailDto> => {
        const charger = await this.prisma.charging_points.findUnique({
            where: { id: charger_id },
            select: {
                id: true,
                external_id: true,
                status: true,
            }
        });

        if (!charger) {
            throw new ConflictException('Charger with this ID does not exist');
        }

        return {
            charger_id: charger.id,
            external_id: charger.external_id ?? '',
            status: charger.status,
        }
    }

    getChargerHealth = async (charger_id: string): Promise<ChargerHealthDto> => {
        const charger = await this.prisma.charging_points.findUnique({
            where: { id: charger_id },
            select: {
                id: true,
                status: true,
                station_incidents: {
                    where: { status: 'open' },
                    select: { description: true }
                }
            }
        });

        if (!charger) {
            throw new ConflictException('Charger with this ID does not exist');
        }

        const health = charger.status === 'available' ? 'ok' : 'offline';
        const errors = charger.station_incidents.map((i) => i.description ?? 'Unknown error');

        return {
            charger_id: charger.id,
            health,
            errors,
        };
    }

    updateFirmware = async (charger_id: string, body: UpdateFirmwareDto): Promise<any> => {
        const charger = await this.prisma.charging_points.findUnique({
            where: { id: charger_id },
        });
        if (!charger) {
            throw new ConflictException('Charger with this ID does not exist');
        }
        const outbox_event = await this.prisma.outbox_events.create({
            data: {
                aggregate_type: 'charger',
                aggregate_id: charger_id,
                event_type: 'firmware_update_requested',
                payload: {
                    charger_id: charger_id,
                    version: body.version,
                    url: body.url,
                },
            },
        });
        return {
            job_id: outbox_event.id,
            status: 'scheduled',
        };
    }

    controlCharger = async (charger_id: string, body: ControlChargerDto): Promise<any> => {
        const charger = await this.prisma.charging_points.findUnique({
            where: { id: charger_id },
        });

        if (!charger) {
            throw new ConflictException('Charger with this ID does not exist');
        }

        await this.prisma.outbox_events.create({
            data: {
                aggregate_type: 'charger',
                aggregate_id: charger_id,
                event_type: 'charger_control',
                payload: {
                    charger_id: charger_id,
                    action: body.action,
                },
            },
        });

        return {
            charger_id: charger_id,
            action: body.action,
            status: 'ok',
        };
    }

    getChargerPricing = async (charger_id: string): Promise<ChargerPricingResponseDto> => {
        const charger = await this.prisma.charging_points.findUnique({
            where: { id: charger_id },
            select: {
                price_per_kwh: true,
                price_per_minute: true,
            },
        });

        if (!charger) {
            throw new NotFoundException('Charger not found');
        }

        const pricing: ChargerPricingItemDto[] = [];

        pricing.push({
            model: 'per_kwh',
            price: Number(charger.price_per_kwh),
            currency: 'VND',
        });

        pricing.push({
            model: 'per_min',
            price: Number(charger.price_per_minute),
            currency: 'VND',
        });

        return { pricing };
    }
}
