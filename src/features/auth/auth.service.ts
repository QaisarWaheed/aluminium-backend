import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/services/user.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(user: any) {
    const payload = { email: user.email, sub: user._id, name: user.name };
    return {
      success: true,
      access_token: this.jwtService.sign(payload),
      user: user,
    };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    // Use the existing logic from UserService
    const result = await this.userService.login(email, pass);
    if (result && result.success && result.user) {
      return result.user;
    }
    return null;
  }
}
