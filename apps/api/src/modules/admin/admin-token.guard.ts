import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

export const SKIP_ADMIN_TOKEN_AUTH = 'skipAdminTokenAuth';

@Injectable()
export class AdminTokenGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext) {
    const shouldSkip = this.reflector.getAllAndOverride<boolean>(SKIP_ADMIN_TOKEN_AUTH, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (shouldSkip) {
      return true;
    }

    const configuredToken = this.configService.get<string>('ADMIN_TOKEN')?.trim();
    if (!configuredToken) {
      throw new ServiceUnavailableException('ADMIN_TOKEN is not configured');
    }

    const request = context.switchToHttp().getRequest<{ headers?: Record<string, string | string[] | undefined> }>();
    const headerValue = request.headers?.['x-admin-token'];
    const providedToken = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    if (!providedToken || providedToken !== configuredToken) {
      throw new UnauthorizedException('Invalid admin token');
    }

    return true;
  }
}
