import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AuthService, JwtPayload } from '../auth/auth.service';

export const SKIP_ADMIN_TOKEN_AUTH = 'skipAdminTokenAuth';

@Injectable()
export class AdminTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const shouldSkip = this.reflector.getAllAndOverride<boolean>(SKIP_ADMIN_TOKEN_AUTH, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (shouldSkip) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers?: Record<string, string | string[] | undefined>;
      user?: { userId: string; username: string; role: string };
    }>();
    const authHeader = request.headers?.authorization;
    const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      throw new UnauthorizedException('Admin authentication required');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const user = await this.authService.validateUser(payload.sub);

      if (!user || user.role !== 'ADMIN') {
        throw new UnauthorizedException('Admin role required');
      }

      request.user = {
        userId: user.id,
        username: user.username,
        role: user.role,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid admin token');
    }
  }
}
