import { Controller, Param, Post, Get, UseGuards, Body, Put } from '@nestjs/common';
import { ChargerService } from './charger.service';
import { RegisterChargerDto, UpdateFirmwareDto, ControlChargerDto, ChargerPricingResponseDto } from 'src/dto/charger.dto';

import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

import { MessagePattern, Payload, RmqContext, Ctx } from '@nestjs/microservices';
import { RmqService } from 'src/rmq/rmq.service';

@Controller('chargers')
export class ChargerController {
    constructor(
        private chargerService: ChargerService,
        private readonly rmqService: RmqService
    ) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post()
    async registerCharger(@Body() body: RegisterChargerDto): Promise<any> {
        return this.chargerService.deviceRegistration(body);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('user', 'admin', 'staff')
    @Get(':charger_id')
    async getChargerDetail(@Param('charger_id') charger_id: string): Promise<any> {
        return this.chargerService.detailOfChargingPoint(charger_id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('user', 'admin', 'staff')
    @Get(':charger_id/health')
    async getChargerHealth(@Param('charger_id') charger_id: string): Promise<any> {
        return this.chargerService.getChargerHealth(charger_id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post(':charger_id/firmware/update')
    async updateChargerFirmware(@Param('charger_id') charger_id: string, @Body() body: UpdateFirmwareDto): Promise<any> {
        return this.chargerService.updateFirmware(charger_id, body);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'staff')
    @Put(':charger_id/control')
    async controlCharger(@Param('charger_id') charger_id: string, @Body() body: ControlChargerDto): Promise<any> {
        return this.chargerService.controlCharger(charger_id, body);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('user', 'admin', 'staff')
    @Get(':charger_id/pricing')
    async getChargerPricing(@Param('charger_id') charger_id: string): Promise<ChargerPricingResponseDto> {
        return this.chargerService.getChargerPricing(charger_id);
    }

    @MessagePattern('start_session')
    handleStartSession(@Payload() data: any, @Ctx() context: RmqContext) {
        this.rmqService.ack(context);
        console.log('Data in rabbitmq: ', data);
        this.chargerService.handleStartSession(data);
    }

    @MessagePattern('stop_session')
    handleStopSession(@Payload() data: any, @Ctx() context: RmqContext) {
        this.rmqService.ack(context);
        console.log('Data in rabbitmq: ', data);
        this.chargerService.handleStopSession(data);
    }
}