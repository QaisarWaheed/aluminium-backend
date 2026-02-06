import { Injectable } from '@nestjs/common';
import { UserService } from '../user/services/user.service';
import { JwtService } from '@nestjs/jwt';
import {
  UserPayload,
  UserLoginResult,
} from './interfaces/user-payload.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthResponseDto } from './dtos/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(user: UserPayload): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      email: user.email,
      sub: user._id,
      name: user.name,
    };
    return {
      success: true,
      access_token: this.jwtService.sign(payload),
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async validateUser(email: string, pass: string): Promise<UserPayload | null> {
    // Use the existing logic from UserService
    const result: UserLoginResult = await this.userService.login(email, pass);
    if (result && result.success && result.user) {
      return result.user;
    }
    return null;
  }
}
