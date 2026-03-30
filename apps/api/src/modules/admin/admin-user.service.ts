import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export interface CreateUserData {
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  persona?: string;
  isSimulated?: boolean;
  password?: string;
  role?: string;
}

export interface UpdateUserData {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  persona?: string;
  role?: string;
}

@Injectable()
export class AdminUserService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(options: { 
    isSimulated?: boolean; 
    page?: number; 
    pageSize?: number;
    search?: string;
  }) {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {
      ...(options.isSimulated !== undefined ? { isSimulated: options.isSimulated } : {}),
      ...(options.search ? {
        OR: [
          { username: { contains: options.search, mode: 'insensitive' } },
          { displayName: { contains: options.search, mode: 'insensitive' } },
          { bio: { contains: options.search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          _count: {
            select: { comments: true, discussions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { 
      items: items.map(user => ({
        ...user,
        commentCount: user._count.comments,
        discussionCount: user._count.discussions,
        _count: undefined,
      })), 
      total, 
      page, 
      pageSize 
    };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { comments: true, discussions: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return {
      ...user,
      commentCount: user._count.comments,
      discussionCount: user._count.discussions,
      _count: undefined,
    };
  }

  async createUser(data: CreateUserData) {
    const existing = await this.prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existing) {
      throw new BadRequestException(`Username ${data.username} already exists`);
    }

    const isSimulated = data.isSimulated ?? false;

    if (!isSimulated && !data.password) {
      throw new BadRequestException('Real users require a password');
    }

    if (!isSimulated && data.password && data.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    if (isSimulated && data.password) {
      throw new BadRequestException('Simulated users cannot have a password');
    }

    const role = data.role === 'ADMIN' ? 'ADMIN' : 'USER';
    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null;

    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        bio: data.bio,
        persona: data.persona,
        isSimulated,
        role,
        passwordHash,
      },
    });

    return user;
  }

  async updateUser(id: string, data: UpdateUserData) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl || null } : {}),
        ...(data.bio !== undefined ? { bio: data.bio || null } : {}),
        ...(data.persona !== undefined ? { persona: data.persona || null } : {}),
        ...(data.role !== undefined ? { role: data.role === 'ADMIN' ? 'ADMIN' : 'USER' } : {}),
      },
    });

    return updated;
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    // 删除用户的评论和讨论，然后删除用户
    await this.prisma.$transaction(async (tx) => {
      await tx.comment.deleteMany({ where: { authorId: id } });
      await tx.discussion.deleteMany({ where: { createdByUserId: id } });
      await tx.user.delete({ where: { id } });
    });

    return { success: true };
  }

  // ==================== Simulated Data Generation ====================

  async createSimulatedUsers(count: number = 10) {
    const personas = [
      { type: 'indie_hacker', prefix: 'builder' },
      { type: 'product_manager', prefix: 'pm' },
      { type: 'designer', prefix: 'designer' },
      { type: 'developer', prefix: 'dev' },
      { type: 'startup_founder', prefix: 'founder' },
      { type: 'tech_enthusiast', prefix: 'techie' },
      { type: 'side_project_lover', prefix: 'side' },
      { type: 'productivity_ninja', prefix: 'ninja' },
    ];

    const bios: Record<string, string[]> = {
      indie_hacker: [
        '正在打造自己的微小产品。相信好的设计能解决大问题。',
        '独立开发者，专注小而美的工具。',
        '热爱构建，从点子到上线只用周末。',
      ],
      product_manager: [
        '产品设计是理性与感性的平衡。',
        '关注用户体验背后的商业逻辑。',
        '喜欢拆解成功产品的方法论。',
      ],
      designer: [
        '界面是产品的灵魂。',
        '相信细节决定体验。',
        '在功能和美观之间找平衡。',
      ],
      developer: [
        '代码是我的画布。',
        '喜欢用技术解决实际问题。',
        '全栈开发，偏向前端体验。',
      ],
      startup_founder: [
        '二次创业中，专注产品方向。',
        '从0到1的路上，不断学习。',
        '寻找下一个值得解决的问题。',
      ],
      tech_enthusiast: [
        '对新技术充满好奇。',
        '喜欢尝鲜各种效率工具。',
        '关注AI时代的创业机会。',
      ],
      side_project_lover: [
        '主业养生活，副业养梦想。',
        '周末黑客，平日打工人。',
        '在碎片时间里构建未来。',
      ],
      productivity_ninja: [
        '效率至上，工具为王。',
        '永远在寻找更好的工作流。',
        '自动化一切可以自动化的。',
      ],
    };

    const names: Record<string, string[]> = {
      indie_hacker: ['林小北', '陈知行', '王开发', '张小墨'],
      product_manager: ['李产品', '周体验', '吴需求', '郑逻辑'],
      designer: ['陈视觉', '林交互', '黄像素', '何动效'],
      developer: ['码农张', '程序李', '算法王', '架构赵'],
      startup_founder: ['创业者刘', 'CEO马', '创始人杨', '合伙人孙'],
      tech_enthusiast: ['极客钱', '科技周', '数码吴', '智能郑'],
      side_project_lover: ['副业陈', '周末林', '摸鱼黄', '兼职何'],
      productivity_ninja: ['效率刘', '时间马', '番茄杨', '日程孙'],
    };

    const created: Array<{ id: string; username: string; displayName: string }> = [];

    for (let i = 0; i < count; i++) {
      const persona = personas[i % personas.length];
      const nameList = names[persona.type];
      const displayName = nameList[Math.floor(Math.random() * nameList.length)];
      const bioList = bios[persona.type];
      const bio = bioList[Math.floor(Math.random() * bioList.length)];
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const username = `${persona.prefix}_${randomSuffix}`;

      try {
        const user = await this.prisma.user.create({
          data: {
            username,
            displayName,
            bio,
            persona: persona.type,
            isSimulated: true,
          },
        });
        created.push(user);
      } catch (error) {
        // 用户名冲突时跳过
        if ((error as { code?: string }).code === 'P2002') {
          continue;
        }
        throw error;
      }
    }

    return { count: created.length, users: created };
  }
}
