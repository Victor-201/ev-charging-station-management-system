import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { Prisma } from '@prisma/client';

import { SearchStationDto, CreateStationDto, UpdateStationDto, ConnectorDto, ReportIssueDto, ScheduleMaintenanceDto } from 'src/dto/station.dto';

@Injectable()
export class StationService {
    constructor(private prisma: PrismaService) { }

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
                error instanceof Prisma.PrismaClientKnownRequestError &&
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
        return await this.prisma.stations.delete({
            where: { id },
        });
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
            connector_id: cp.id,
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

    scheduleMaintenance = async (station_id: string,scheduled_by: string, data: ScheduleMaintenanceDto): Promise<any> => {
        const station = await this.prisma.stations.findUnique({
            where: { id: station_id },
        });

        if (!station) {
            throw new NotFoundException('Station not found');
        }

        await this.prisma.stations.update({
            where: { id: station_id },
            data: { status: 'scheduled' },
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
        return { status: 'scheduled' };
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
