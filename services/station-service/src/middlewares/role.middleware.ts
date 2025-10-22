import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class JwtMiddleware implements NestMiddleware {
    constructor(private readonly ConfigService: ConfigService) { }

    use(req: Request, res: Response, next: NextFunction) {
        const authHeader = req.headers['authorization'];
        const token = authHeader?.split(' ')[1]; // Bearer <token>

        if (!token) {
            throw new UnauthorizedException('Token không tồn tại');
        }

        try {
            const secret = this.ConfigService.get<string>('JWT_SECRET');
            if (!secret) {
                throw new Error('Thiếu JWT_SECRET trong file .env');
            }
            const decoded = jwt.verify(token, secret) as JwtPayload;
            req['user'] = decoded;
            next();
        } catch (err) {
            throw new UnauthorizedException('Token không hợp lệ');
        }
    }
}
