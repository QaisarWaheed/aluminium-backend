import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { UserFromJwt } from '../auth/interfaces/jwt-payload.interface';
import { CloseSessionDto } from './dtos/close-session.dto';
import { OpenSessionDto } from './dtos/open-session.dto';
import { SessionService } from './session.service';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get('active')
  async getActiveSession(@Req() request: Request & { user: UserFromJwt }) {
    return this.sessionService.getActiveSessionSummary(request.user.userId);
  }

  @Post('open')
  async openSession(
    @Req() request: Request & { user: UserFromJwt },
    @Body() dto: OpenSessionDto,
  ) {
    return this.sessionService.openSession(request.user.userId, dto);
  }

  @Post('close')
  async closeSession(
    @Req() request: Request & { user: UserFromJwt },
    @Body() dto: CloseSessionDto,
  ) {
    return this.sessionService.closeSession(request.user.userId, dto);
  }
}
