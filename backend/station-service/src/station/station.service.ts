import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException, Inject } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import {
    SearchStationDto,
    CreateStationDto,
    UpdateStationDto,
    ConnectorDto,
    ReportIssueDto,
    ScheduleMaintenanceDto,
    StationStatus,
    PricingItemDto,
    GetListOfStation,
    StationAbilityItemDto,
    StationAbilityDto
} from 'src/dto/station.dto';

import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StationService {

    private pendingResponses = new Map<string, (data: StationAbilityDto) => void>();

    constructor(
        private prisma: PrismaService,
        @Inject('STATION') private readonly stationClient: ClientProxy,
        private readonly configService: ConfigService
    ) { }

    searchStations = async (query: SearchStationDto): Promise<any[]> => {
        const {
            lat,
            lng,
            radius,
            connector_type,
            power_min,
            status,
            page = '1',
            size = '10',
        } = query;

        if (!lat || !lng || !radius) {
            throw new BadRequestException('lat, lng and radius is required');
        }

        const take = parseInt(size);
        const skip = (parseInt(page) - 1) * take;

        const filters: any = {};

        if (status) filters.status = status;

        if (connector_type || power_min) {
            filters.charging_points = {
                some: {
                    ...(connector_type && { connector_type }),
                    ...(power_min && { power: { gte: parseFloat(power_min) } }),
                },
            };
        }

        let stations = await this.prisma.stations.findMany({
            where: filters,
            include: { charging_points: true },
            skip,
            take,
        });


        stations = stations.filter((station) => {
            if (!station.latitude || !station.longitude) return false;

            const distance = getDistanceKm(
                lat,
                lng,
                Number(station.latitude),
                Number(station.longitude),
            );

            return distance <= radius;
        });

        return stations;
    }

    createStation = async (body: CreateStationDto): Promise<any> => {
        try {
            return await this.prisma.stations.create({
                data: {
                    name: body.name,
                    address: body.address,
                    city: body.city,
                    region: body.region,
                    latitude: body.location.lat,
                    longitude: body.location.lng,
                    status: body.status,
                },
            });
        } catch (error) {
            console.error('Prisma error:', error);

            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new BadRequestException('The station already exists');
            }

            throw new InternalServerErrorException('Error system, please try again later');
        }
    }

    getStationById = async (id: string): Promise<any> => {
        const station = await this.prisma.stations.findFirst({ where: { id } });

        if (!station) {
            throw new NotFoundException('Station not found');
        }

        return {
            id: station.id,
            name: station.name,
            address: station.address,
            city: station.city,
            region: station.region,
            lat: station.latitude?.toNumber(),
            lng: station.longitude?.toNumber(),
            status: station.status,
        };
    }

    updateStation = async (id: string, body: UpdateStationDto): Promise<any> => {
        const existing = await this.prisma.stations.findUnique({ where: { id } });

        if (!existing) {
            throw new NotFoundException('Station not found');
        }

        return await this.prisma.stations.update({
            where: { id },
            data: body,
        });
    }

    deleteStation = async (id: string): Promise<any> => {
        const existing = await this.prisma.stations.findUnique({ where: { id } });

        if (!existing) {
            throw new NotFoundException('Station not found');
        }
        const result = await this.prisma.$transaction(async (tx) => {

            await tx.outbox_events.create({
                data: {
                    aggregate_type: 'stations',
                    aggregate_id: id,
                    event_type: 'station.deleted',
                    payload: { station_id: id }
                }
            });

            return await tx.stations.delete({
                where: { id },
            });
        });

        return result;
    }

    getConnectorByStationId = async (id: string): Promise<ConnectorDto[]> => {
        const station = await this.prisma.stations.findUnique({
            where: { id },
            include: { charging_points: true },
        });

        if (!station) {
            throw new NotFoundException('Station not found');
        }

        if (!station.charging_points || station.charging_points.length === 0) {
            return [];
        }
        return station.charging_points.map((cp) => ({
            point_id: cp.id,
            type: cp.connector_type ?? 'unknown',
            max_power_kw: Number(cp.max_power_kw ?? 0),
            status: cp.status ?? 'unknown',
        }));
    }

    reportIssue = async (data: ReportIssueDto, reported_by: string, station_id: string): Promise<any> => {

        const report = await this.prisma.station_incidents.create({
            data: {
                station_id: station_id,
                point_id: data.connector_id,
                reported_by: reported_by,
                description: data.description,
                severity: data.severity ? data.severity : 'medium',
            },
        });
        return { incident_id: report.id, status: 'reported' };
    }

    scheduleMaintenance = async (station_id: string, scheduled_by: string, data: ScheduleMaintenanceDto): Promise<any> => {
        const station = await this.prisma.stations.findUnique({
            where: { id: station_id },
        });

        if (!station) {
            throw new NotFoundException('Station not found');
        }

        await this.prisma.stations.update({
            where: { id: station_id },
            data: { status: 'maintenance' },
        });

        await this.prisma.station_maintenance.create({
            data: {
                station_id,
                start_time: new Date(data.start),
                end_time: new Date(data.end),
                reason: data.reason,
                scheduled_by,
            },
        });
        return { status: 'maintance' };
    }

    getPricingByStation = async (station_id: string): Promise<{ pricing: PricingItemDto[] }> => {
        const points = await this.prisma.charging_points.findMany({
            where: { station_id },
            select: {
                id: true,
                price_per_kwh: true,
                price_per_minute: true,
            },
        });

        if (!points || points.length === 0) {
            return { pricing: [] };
        }

        const pricing: PricingItemDto[] = [];

        points.forEach((point) => {
            if (point.price_per_kwh !== null) {
                pricing.push({
                    point_id: point.id,
                    model: 'per_kwh',
                    price: point.price_per_kwh.toNumber(),
                    currency: 'USD',
                });
            }
            if (point.price_per_minute !== null) {
                pricing.push({
                    point_id: point.id,
                    model: 'per_minute',
                    price: point.price_per_minute.toNumber(),
                    currency: 'USD',
                });
            }
        });

        return { pricing }
    }

    getListOfStation = async (): Promise<GetListOfStation[]> => {
        const stations = await this.prisma.stations.findMany();

        if (!stations || stations.length === 0) {
            throw new NotFoundException('Station not found');
        }

        return stations.map((station) => ({
            id: station.id,
            name: station.name,
            address: station.address,
            city: station.city,
            region: station.region,
            lat: station.latitude?.toNumber(),
            lng: station.longitude?.toNumber(),
            status: station.status as StationStatus,
        }));
    }

    updateStatus = async (station_id: string, status: StationStatus): Promise<any> => {
        const station = await this.prisma.stations.findUnique({
            where: { id: station_id },
        });

        if (!station) {
            throw new NotFoundException('Station not found');
        }

        return await this.prisma.stations.update({
            where: { id: station_id },
            data: { status: status },
        });
    }

    getStationAbility = async (body: StationAbilityItemDto): Promise<StationAbilityDto> => {
        const correlationId = body.station_id + '-' + Date.now();

        const responsePromise = new Promise<StationAbilityDto>((resolve, reject) => {
            this.pendingResponses.set(correlationId, resolve);

            setTimeout(() => {
                if (this.pendingResponses.has(correlationId)) {
                    this.pendingResponses.delete(correlationId);
                    reject(new Error('Timeout waiting for Charger response'));
                }
            }, 5000)
        });

        const routingKey = this.configService.get<string>('RABBITMQ_STATION_QUEUE');
        const exchange = this.configService.get<string>('EXCHANGE_NAME');
        this.stationClient.emit(
            { exchange: exchange, routingKey: routingKey },
            { ...body, correlationId }
        );

        return responsePromise;
    }

    handleChargerAvailability(data: any) {
        const { correlationId, availability } = data;
        const resolve = this.pendingResponses.get(correlationId);
        if (resolve) {
            resolve({ availability });
            this.pendingResponses.delete(correlationId);
        }
    }

    getHistoryOfReports = async (station_id: string): Promise<any[]> => {
        const station = await this.prisma.stations.findUnique({
            where: { id: station_id },
        });
        if (!station) {
            throw new NotFoundException('Station not found');
        }
        const reports = await this.prisma.station_incidents.findMany({
            where: { station_id },
        });
        return reports;
    }

    getAllHistoryOfReports = async (): Promise<any[]> => {
        const reports = await this.prisma.station_incidents.findMany();
        return reports;
    }
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}
