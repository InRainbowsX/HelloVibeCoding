import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
  sub: string;  // user id
  username: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(username: string, password: string, displayName: string) {
    // 检查用户名是否已存在（包括模拟用户）
    const existing = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      throw new ConflictException('Username already exists');
    }

    // 密码强度检查
    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    // 哈希密码
    const passwordHash = await bcrypt.hash(password, 10);

    const adminCount = await this.prisma.user.count({
      where: { role: 'ADMIN', isSimulated: false },
    });

    // 第一个真实注册用户自动成为管理员，作为系统 bootstrap 入口。
    const role = adminCount === 0 ? 'ADMIN' : 'USER';

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        username,
        displayName: displayName || username,
        passwordHash,
        isSimulated: false,
        role,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        createdAt: true,
      },
    });

    // 生成 JWT
    const token = this.generateToken(user.id, user.username, user.role);

    return {
      user,
      token,
    };
  }

  async login(username: string, password: string) {
    // 查找用户（不包括模拟用户）
    const user = await this.prisma.user.findFirst({
      where: {
        username,
        isSimulated: false,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        passwordHash: true,
        createdAt: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 生成 JWT
    const token = this.generateToken(user.id, user.username, user.role);

    // 不返回 passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        isSimulated: true,
        createdAt: true,
        _count: {
          select: {
            comments: true,
            discussions: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      ...user,
      commentCount: user._count.comments,
      discussionCount: user._count.discussions,
      _count: undefined,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        isSimulated: true,
      },
    });

    return user;
  }

  private generateToken(userId: string, username: string, role: string): string {
    const payload: JwtPayload = {
      sub: userId,
      username,
      role,
    };

    return this.jwtService.sign(payload);
  }
}
