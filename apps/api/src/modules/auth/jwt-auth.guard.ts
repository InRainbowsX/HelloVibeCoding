import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService, JwtPayload } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers?: Record<string, string | string[] | undefined>;
      user?: { userId: string; username: string; role: string };
    }>();

    const authHeader = request.headers?.['authorization'];
    const token = this.extractToken(authHeader);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // 验证 JWT
      const payload = this.jwtService.verify<JwtPayload>(token);
      
      // 验证用户是否存在且有效
      const user = await this.authService.validateUser(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // 将用户信息附加到请求对象
      request.user = {
        userId: payload.sub,
        username: payload.username,
        role: payload.role,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractToken(authHeader: string | string[] | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    const parts = header.split(' ');

    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }

    return null;
  }
}
