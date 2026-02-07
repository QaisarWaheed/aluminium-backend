import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? '',
    });

    if (!configService.get<string>('JWT_SECRET')) {
      throw new Error(
        'CRITICAL: JWT_SECRET environment variable is required for security',
      );
    }
  }

  async validate(payload: JwtPayload) {
    // Return user object which will be injected into request object
    return { userId: payload.sub, email: payload.email, name: payload.name };
  }
}
