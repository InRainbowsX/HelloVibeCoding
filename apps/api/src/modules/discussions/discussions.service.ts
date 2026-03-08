import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TargetType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { ListDiscussionsQueryDto } from './dto/list-discussions-query.dto';

@Injectable()
export class DiscussionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListDiscussionsQueryDto) {
    const page = Math.max(Number(query.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize || 12), 1), 50);

    const where: Prisma.DiscussionWhereInput = {
      ...(query.targetType ? { targetType: query.targetType as TargetType } : {}),
      ...(query.targetId ? { targetId: query.targetId } : {}),
    };

    const orderBy = query.sort === 'top' ? { likesCount: 'desc' as const } : { createdAt: 'desc' as const };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.discussion.count({ where }),
      this.prisma.discussion.findMany({
        where,
        include: {
          app: {
            select: {
              slug: true,
              name: true,
            },
          },
          incubation: {
            select: {
              slug: true,
              title: true,
            },
          },
          comments: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  async createDiscussion(dto: CreateDiscussionDto) {
    if (!dto.title?.trim() || !dto.authorName?.trim() || !dto.content?.trim() || !dto.targetId?.trim()) {
      throw new BadRequestException('title, targetId, authorName and content are required');
    }

    const targetType = dto.targetType as TargetType;
    if (!Object.values(TargetType).includes(targetType)) {
      throw new BadRequestException('targetType must be APP, PROJECT, PATTERN or INCUBATION');
    }

    if (targetType === 'APP' || targetType === 'PROJECT') {
      const app = await this.prisma.app.findUnique({ where: { id: dto.targetId } });
      if (!app) {
        throw new NotFoundException(`Project ${dto.targetId} not found`);
      }
    }

    if (targetType === 'PATTERN') {
      const pattern = await this.prisma.pattern.findUnique({ where: { id: dto.targetId } });
      if (!pattern) {
        throw new NotFoundException(`Pattern ${dto.targetId} not found`);
      }
    }

    if (targetType === 'INCUBATION') {
      const incubation = await this.prisma.ideaIncubation.findUnique({ where: { id: dto.targetId } });
      if (!incubation) {
        throw new NotFoundException(`Incubation ${dto.targetId} not found`);
      }
    }

    const discussion = await this.prisma.discussion.create({
      data: {
        title: dto.title.trim(),
        summary: dto.content.trim().slice(0, 140),
        targetType,
        targetId: dto.targetId.trim(),
        createdBy: dto.authorName.trim(),
        replyCount: 1,
        lastActivityAt: new Date(),
        ...(targetType === 'APP' || targetType === 'PROJECT' ? { appId: dto.targetId.trim() } : {}),
        ...(targetType === 'PATTERN' ? { patternId: dto.targetId.trim() } : {}),
        ...(targetType === 'INCUBATION' ? { incubationId: dto.targetId.trim() } : {}),
        comments: {
          create: {
            authorName: dto.authorName.trim(),
            content: dto.content.trim(),
          },
        },
      },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return discussion;
  }

  async createComment(discussionId: string, dto: CreateCommentDto) {
    if (!dto.authorName?.trim() || !dto.content?.trim()) {
      throw new BadRequestException('authorName and content are required');
    }

    const discussion = await this.prisma.discussion.findUnique({
      where: { id: discussionId },
    });

    if (!discussion) {
      throw new NotFoundException(`Discussion ${discussionId} not found`);
    }

    if (dto.replyToCommentId) {
      const replyTarget = await this.prisma.comment.findUnique({
        where: { id: dto.replyToCommentId },
      });

      if (!replyTarget || replyTarget.discussionId !== discussionId) {
        throw new BadRequestException('replyToCommentId must belong to the same discussion');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        discussionId,
        authorName: dto.authorName.trim(),
        content: dto.content.trim(),
        replyToCommentId: dto.replyToCommentId,
      },
    });

    await this.prisma.discussion.update({
      where: { id: discussionId },
      data: {
        replyCount: {
          increment: 1,
        },
        lastActivityAt: new Date(),
      },
    });

    return comment;
  }

  async likeDiscussion(id: string) {
    try {
      return await this.prisma.discussion.update({
        where: { id },
        data: {
          likesCount: {
            increment: 1,
          },
        },
        include: {
          comments: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Discussion ${id} not found`);
      }
      throw error;
    }
  }

  async findOne(id: string) {
    const discussion = await this.prisma.discussion.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!discussion) {
      throw new NotFoundException(`Discussion ${id} not found`);
    }

    return discussion;
  }
}
