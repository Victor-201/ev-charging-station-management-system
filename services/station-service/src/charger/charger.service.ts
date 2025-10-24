import { Get, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ChargerService {
    constructor(private readonly PrismaService: PrismaService){}

    getStations(){
        
    }
}
