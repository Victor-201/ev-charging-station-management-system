import { Controller, Param, Post, Get, UseGuards, Body } from '@nestjs/common';
import { ChargerService } from './charger.service';
import { RegisterChargerDto, UpdateFirmwareDto, ControlChargerDto, ChargerPricingResponseDto } from 'src/dto/charger.dto';

import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('chargers')
export class ChargerController {
    constructor( private chargerService: ChargerService ) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post()
    async registerCharger( @Body() body: RegisterChargerDto ): Promise<any> {
        return this.chargerService.deviceRegistration( body );
    }

    @Get(':charger_id')
    async getChargerDetail(@Param('charger_id') charger_id: string): Promise<any> {
        return this.chargerService.detailOfChargingPoint( charger_id );
    }

    @Get(':charger_id/health')
    async getChargerHealth(@Param('charger_id') charger_id: string): Promise<any> {
        return this.chargerService.getChargerHealth( charger_id );
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post(':charger_id/firmware/update')
    async updateChargerFirmware(@Param('charger_id') charger_id: string, @Body() body: UpdateFirmwareDto): Promise<any> {
        return this.chargerService.updateFirmware( charger_id, body );
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin','staff')
    @Post(':charger_id/control')
    async controlCharger(@Param('charger_id') charger_id: string, @Body() body: ControlChargerDto): Promise<any> {
        return this.chargerService.controlCharger( charger_id, body );
    }

    @Get(':charger_id/pricing')
    async getChargerPricing(@Param('charger_id') charger_id: string): Promise<ChargerPricingResponseDto> {
        return this.chargerService.getChargerPricing( charger_id );
    }

    @Post(':charger_id/in_use')
    async chargerInUse(@Param('charger_id') charger_id: string): Promise<any> {
        return this.chargerService.chargerInUse(charger_id);
    }
    

    @Post(':charger_id/available')
    async chargerAvailable(@Param('charger_id') charger_id: string): Promise<any> {
        return this.chargerService.chargerAvailable(charger_id);
    }
    
}
