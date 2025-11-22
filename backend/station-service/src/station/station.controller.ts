import { Controller, Get, Query, Post, Body, Put, Delete, UseGuards, Param, Req, HttpException, HttpStatus } from '@nestjs/common';
import { StationService } from './station.service';

import type { Request } from 'express';

import { SearchStationDto, CreateStationDto, UpdateStationDto, ReportIssueDto, StationPricingDto, GetStation, StationStatus, StationAbilityItemDto, StationAbilityDto } from 'src/dto/station.dto';

import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

import { MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { RmqService } from 'src/rmq/rmq.service';

@Controller('stations')
export class StationController {
    constructor(
        private stationService: StationService,
        private readonly rmqService: RmqService
    ) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'staff', 'user')
    @Get('/search')
    async searchStations(@Query() query: SearchStationDto) {
        return this.stationService.searchStations(query);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'staff', 'user')
    @Get()
    async getListOfStation(): Promise<GetStation[]> {
        return this.stationService.getListOfStation();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('staff')
    @Get('staff/assigned-station')
    async getAssignedStation(@Req() req: Request) {
        const staff_user_id = (req as any).user?.user_id;
        return this.stationService.getAssignedStation(staff_user_id);
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

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'staff', 'user')
    @Get(':id/connectors')
    async getConnectorByStationId(@Param('id') id: string) {
        console.log('Fetching connectors for station ID:', id);
        return this.stationService.getConnectorByStationId(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'staff', 'user')
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
        @Body() data: {
            start: string; end: string; reason: string
        }) {
        const scheduled_by = (req as any).user?.id;
        return this.stationService.scheduleMaintenance(station_id, scheduled_by, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'staff', 'user')
    @Get(':id/pricing')
    async getPricingByStation(@Param('id') id: string): Promise<StationPricingDto> {
        return this.stationService.getPricingByStation(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'staff')
    @Put(':id/status')
    async updateStationStatus(@Param('id') id: string, @Body() body: { status: StationStatus }): Promise<any> {
        return this.stationService.updateStatus(id, body.status);
    }

    @MessagePattern({ queue: 'charger_availability_queue', routingKey: 'charger.availability' })
    handleChargerAvailability(@Payload() data: any, @Payload() context: RmqContext) {
        this.rmqService.ack(context);
        this.stationService.handleChargerAvailability(data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'staff', 'user')
    @Post('ability')
    async getStationAbility(@Body() body: StationAbilityItemDto): Promise<StationAbilityDto> {
        try {
            return await this.stationService.getStationAbility(body);
        } catch (error) {
            throw new HttpException(
                { message: error.message || 'Timeout waiting for response' },
                HttpStatus.REQUEST_TIMEOUT
            );
        }
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'staff', 'user')
    @Get('report-issues/all')
    async getAllHistoryOfReports() {
        return this.stationService.getAllHistoryOfReports();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'staff', 'user')
    @Get(':id/report-issues')
    async getHistoryOfReports(@Param('id') id: string) {
        return this.stationService.getHistoryOfReports(id);
    }

}