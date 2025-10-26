import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private configService: ConfigService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        const token = authHeader?.split(' ')[1];

        if (!token) {
            throw new UnauthorizedException('Invalid token');
        }

        try {
            const secret = this.configService.get<string>('JWT_SECRET');
            if (!secret) {
                throw new UnauthorizedException('Error secret not found');
            }
            const decoded = jwt.verify(token, secret);
            request.user = decoded;
            return true;
        } catch (err) {
            console.error('JWT decode error:', err.message);
            throw new UnauthorizedException('Invalid token');
        }
    }
}
