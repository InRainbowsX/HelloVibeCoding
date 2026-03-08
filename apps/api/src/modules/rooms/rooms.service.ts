import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoomMessageDto } from './dto/create-room-message.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const items = await this.prisma.room.findMany({
      include: {
        app: true,
        incubation: true,
        members: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        goal: item.goal,
        status: item.status,
        targetType: item.targetType,
        target:
          item.targetType === 'PROJECT'
            ? item.app
              ? { slug: item.app.slug, name: item.app.name }
              : null
            : item.incubation
              ? { slug: item.incubation.slug, name: item.incubation.title }
              : null,
        memberCount: item.members.length,
        latestMessage: item.messages[0]?.content || null,
      })),
      total: items.length,
    };
  }

  async create(dto: CreateRoomDto) {
    if (!dto.slug?.trim() || !dto.name?.trim() || !dto.goal?.trim() || !dto.createdBy?.trim() || !dto.targetId?.trim()) {
      throw new BadRequestException('slug, name, goal, createdBy and targetId are required');
    }

    if (dto.targetType === 'PROJECT') {
      const app = await this.prisma.app.findUnique({ where: { id: dto.targetId } });
      if (!app) {
        throw new NotFoundException(`Project ${dto.targetId} not found`);
      }

      const room = await this.prisma.room.create({
        data: {
          slug: dto.slug.trim(),
          name: dto.name.trim(),
          goal: dto.goal.trim(),
          targetType: 'PROJECT',
          targetId: dto.targetId.trim(),
          createdBy: dto.createdBy.trim(),
          appId: dto.targetId.trim(),
        },
        include: {
          app: true,
          members: true,
          messages: true,
        },
      });

      return {
        id: room.id,
        slug: room.slug,
        name: room.name,
        goal: room.goal,
        status: room.status,
        targetType: room.targetType,
        target: room.app ? { slug: room.app.slug, name: room.app.name } : null,
      };
    }

    if (dto.targetType !== 'INCUBATION') {
      throw new BadRequestException('targetType must be PROJECT or INCUBATION');
    }

    const incubation = await this.prisma.ideaIncubation.findUnique({ where: { id: dto.targetId } });
    if (!incubation) {
      throw new NotFoundException(`Incubation ${dto.targetId} not found`);
    }

    const room = await this.prisma.room.create({
      data: {
        slug: dto.slug.trim(),
        name: dto.name.trim(),
        goal: dto.goal.trim(),
        targetType: 'INCUBATION',
        targetId: dto.targetId.trim(),
        createdBy: dto.createdBy.trim(),
        incubationId: dto.targetId.trim(),
      },
      include: {
        incubation: true,
        members: true,
        messages: true,
      },
    });

    return {
      id: room.id,
      slug: room.slug,
      name: room.name,
      goal: room.goal,
      status: room.status,
      targetType: room.targetType,
      target: room.incubation ? { slug: room.incubation.slug, name: room.incubation.title } : null,
    };
  }

  async findOne(slug: string) {
    const room = await this.prisma.room.findUnique({
      where: { slug },
      include: {
        app: true,
        incubation: true,
        members: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Room ${slug} not found`);
    }

    return {
      id: room.id,
      slug: room.slug,
      name: room.name,
      goal: room.goal,
      status: room.status,
      targetType: room.targetType,
      target:
        room.targetType === 'PROJECT'
          ? room.app
            ? { slug: room.app.slug, name: room.app.name }
            : null
          : room.incubation
            ? { slug: room.incubation.slug, name: room.incubation.title }
            : null,
      memberCount: room.members.length,
      messages: room.messages,
    };
  }

  async createMessage(slug: string, dto: CreateRoomMessageDto) {
    if (!dto.userId?.trim() || !dto.userName?.trim() || !dto.content?.trim()) {
      throw new BadRequestException('userId, userName and content are required');
    }

    const room = await this.prisma.room.findUnique({ where: { slug } });
    if (!room) {
      throw new NotFoundException(`Room ${slug} not found`);
    }

    return this.prisma.roomMessage.create({
      data: {
        roomId: room.id,
        userId: dto.userId.trim(),
        userName: dto.userName.trim(),
        content: dto.content.trim(),
      },
    });
  }
}
