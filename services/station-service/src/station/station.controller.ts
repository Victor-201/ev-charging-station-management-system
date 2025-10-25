import { Controller, Get, Query, Post, Body, Put, Delete, UseGuards, Param, Req } from '@nestjs/common';
import { StationService } from './station.service';

import type { Request } from 'express';

import { SearchStationDto, CreateStationDto, UpdateStationDto, ReportIssueDto, StationPricingDto } from 'src/dto/station.dto';

import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';


@Controller('stations')
export class StationController {
    constructor(private stationService: StationService) {}

    @Get()
    async searchStations(@Query() query: SearchStationDto) {
        return this.stationService.searchStations(query);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post()
    async createStation(@Body() body: CreateStationDto) {
        return this.stationService.createStation(body);
    }

    @Get(':id')
    async getStationById(@Param('id') id: string) {
        return this.stationService.getStationById(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Put(':id')
    async updateStation(@Param('id') id: string, @Body() body: UpdateStationDto) {
        return this.stationService.updateStation(id, body);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Delete(':id')
    async deleteStation(@Param('id') id: string) {
        return this.stationService.deleteStation(id);
    }

    @Get(':id/connectors')
    async getConnectorByStationId(@Param('id') id: string) {
        console.log('Fetching connectors for station ID:', id);
        return this.stationService.getConnectorByStationId(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/report-issue')
    async reportIssue(@Param('id') id: string, @Req() req: any, @Body() body: ReportIssueDto) {
        const userId = req.user?.id;
        console.log('Reporting issue for station ID:', id, 'by user ID:', userId);
        return this.stationService.reportIssue(body, userId, id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'staff')
    @Post(':id/maintenance')
    async scheduleMaintenance( 
        @Param('id') station_id: string, 
        @Req() req: Request, 
        @Body() data: { start: string; end: string; reason: string 
    }) {
        const scheduled_by = (req as any).user?.id;
        return this.stationService.scheduleMaintenance(station_id, scheduled_by, data);
    }

    @Get(':id/pricing')
    async getPricingByStation(@Param('id') id: string) : Promise<StationPricingDto> {
        return this.stationService.getPricingByStation(id);
    }
}
