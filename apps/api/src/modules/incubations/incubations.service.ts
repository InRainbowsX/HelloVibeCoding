import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EngagementTargetType } from '@prisma/client';
import { EngagementService } from '../engagement/engagement.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncubationDto } from './dto/create-incubation.dto';

@Injectable()
export class IncubationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engagementService: EngagementService,
  ) {}

  async findAll(pageRaw?: string, pageSizeRaw?: string, viewerId?: string) {
    const page = Math.max(Number(pageRaw || 1), 1);
    const pageSize = Math.min(Math.max(Number(pageSizeRaw || 20), 1), 50);

    const [total, items] = await this.prisma.$transaction([
      this.prisma.ideaIncubation.count(),
      this.prisma.ideaIncubation.findMany({
        include: {
          blocks: {
            include: {
              ideaBlock: true,
            },
          },
          discussions: true,
          rooms: true,
          sourceProjects: true,
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const states = await this.engagementService.mapStates(
      EngagementTargetType.INCUBATION,
      items.map((item) => item.id),
      viewerId,
    );

    return {
      items: items.map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        oneLiner: item.oneLiner,
        status: item.status,
        tags: Array.from(new Set(item.blocks.flatMap((block) => block.ideaBlock.tags))).slice(0, 6),
        discussionCount: item.discussions.length,
        blockCount: item.blocks.length,
        roomCount: item.rooms.length,
        sourceProjectCount: item.sourceProjects.length,
        likeCount: states.get(item.id)?.likeCount || 0,
        favoriteCount: states.get(item.id)?.favoriteCount || 0,
        viewerHasLiked: states.get(item.id)?.viewerHasLiked || false,
        viewerHasFavorited: states.get(item.id)?.viewerHasFavorited || false,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(slug: string, viewerId?: string) {
    const incubation = await this.prisma.ideaIncubation.findUnique({
      where: { slug },
      include: {
        blocks: {
          include: {
            ideaBlock: {
              include: {
                sources: {
                  include: {
                    app: true,
                  },
                },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        sourceProjects: {
          include: {
            app: true,
          },
        },
        discussions: {
          include: {
            comments: true,
          },
          orderBy: { lastActivityAt: 'desc' },
        },
        rooms: true,
      },
    });

    if (!incubation) {
      throw new NotFoundException(`Incubation ${slug} not found`);
    }

    const state = await this.engagementService.getState(EngagementTargetType.INCUBATION, incubation.id, viewerId);

    return {
      id: incubation.id,
      slug: incubation.slug,
      title: incubation.title,
      oneLiner: incubation.oneLiner,
      status: incubation.status,
      likeCount: state.likeCount,
      favoriteCount: state.favoriteCount,
      viewerHasLiked: state.viewerHasLiked,
      viewerHasFavorited: state.viewerHasFavorited,
      sourceProjects: incubation.sourceProjects.map((item) => ({
        slug: item.app.slug,
        name: item.app.name,
      })),
      blocks: incubation.blocks.map((item) => ({
        slug: item.ideaBlock.slug,
        title: item.ideaBlock.title,
        summary: item.ideaBlock.summary,
        blockType: item.ideaBlock.blockType,
      })),
      discussions: incubation.discussions.map((discussion) => ({
        id: discussion.id,
        title: discussion.title,
        createdBy: discussion.createdBy,
        summary: discussion.summary,
        commentCount: discussion.comments.length,
        lastActivityAt: discussion.lastActivityAt,
        comments: discussion.comments,
      })),
      rooms: incubation.rooms,
    };
  }

  async create(dto: CreateIncubationDto) {
    if (!dto.slug?.trim() || !dto.title?.trim() || !dto.oneLiner?.trim() || !dto.createdBy?.trim()) {
      throw new BadRequestException('slug, title, oneLiner and createdBy are required');
    }

    if (!Array.isArray(dto.blockSlugs) || dto.blockSlugs.length === 0) {
      throw new BadRequestException('blockSlugs must include at least one idea block');
    }

    const [blocks, apps] = await Promise.all([
      this.prisma.ideaBlock.findMany({
        where: { slug: { in: dto.blockSlugs } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.app.findMany({
        where: { slug: { in: dto.sourceProjectSlugs || [] } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    if (blocks.length !== dto.blockSlugs.length) {
      throw new NotFoundException('One or more idea blocks were not found');
    }

    const created = await this.prisma.ideaIncubation.create({
      data: {
        slug: dto.slug.trim(),
        title: dto.title.trim(),
        oneLiner: dto.oneLiner.trim(),
        createdBy: dto.createdBy.trim(),
        blocks: {
          create: blocks.map((block, index) => ({
            ideaBlockId: block.id,
            sortOrder: index,
          })),
        },
        sourceProjects: {
          create: apps.map((app) => ({
            appId: app.id,
          })),
        },
      },
      include: {
        blocks: {
          include: {
            ideaBlock: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        sourceProjects: {
          include: {
            app: true,
          },
        },
        discussions: true,
        rooms: true,
      },
    });

    return {
      id: created.id,
      slug: created.slug,
      title: created.title,
      oneLiner: created.oneLiner,
      status: created.status,
      sourceProjects: created.sourceProjects.map((item) => ({
        slug: item.app.slug,
        name: item.app.name,
      })),
      blocks: created.blocks.map((item) => ({
        slug: item.ideaBlock.slug,
        title: item.ideaBlock.title,
      })),
      discussions: created.discussions,
      rooms: created.rooms,
    };
  }

  async toggleLike(slug: string, userId: string, active?: boolean) {
    const incubation = await this.prisma.ideaIncubation.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!incubation) {
      throw new NotFoundException(`Incubation ${slug} not found`);
    }

    return this.engagementService.toggleLike(EngagementTargetType.INCUBATION, incubation.id, userId, active);
  }

  async toggleFavorite(slug: string, userId: string, active?: boolean) {
    const incubation = await this.prisma.ideaIncubation.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!incubation) {
      throw new NotFoundException(`Incubation ${slug} not found`);
    }

    return this.engagementService.toggleFavorite(EngagementTargetType.INCUBATION, incubation.id, userId, active);
  }
}
