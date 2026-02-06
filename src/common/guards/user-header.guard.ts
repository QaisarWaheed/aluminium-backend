import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class UserHeaderGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const userId = req.headers['x-user-id'] || req.headers['x-userid'];
    if (!userId) {
      throw new UnauthorizedException('Missing x-user-id header');
    }
    // attach to request for controllers
    req.user = { id: String(userId) };
    return true;
  }
}
