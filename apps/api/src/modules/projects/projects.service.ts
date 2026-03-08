import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';

const SORT_MAP: Record<string, Prisma.AppOrderByWithRelationInput | Prisma.AppOrderByWithRelationInput[]> = {
  hot: { heatScore: 'desc' },
  latest: { createdAt: 'desc' },
  discussed: [{ discussions: { _count: 'desc' } }, { heatScore: 'desc' }],
};

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListProjectsQueryDto) {
    const page = Math.max(Number(query.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize || 12), 1), 48);
    const where: Prisma.AppWhereInput = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { tagline: { contains: query.search, mode: 'insensitive' } },
            { category: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [total, items] = await this.prisma.$transaction([
      this.prisma.app.count({ where }),
      this.prisma.app.findMany({
        where,
        include: {
          discussions: true,
          ideaBlockSources: true,
          incubationLinks: true,
          rooms: true,
        },
        orderBy: SORT_MAP[query.sort || 'hot'] || SORT_MAP.hot,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        tagline: item.tagline,
        category: item.category,
        pricing: item.pricing,
        heatScore: item.heatScore,
        discussionCount: item.discussions.length,
        ideaBlockCount: item.ideaBlockSources.length,
        incubationCount: item.incubationLinks.length,
        roomCount: item.rooms.length,
        createdAt: item.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(slug: string) {
    const project = await this.prisma.app.findUnique({
      where: { slug },
      include: {
        teardown: true,
        assetBundle: true,
        discussions: {
          include: {
            comments: {
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { lastActivityAt: 'desc' },
        },
        ideaBlockSources: {
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
        },
        incubationLinks: {
          include: {
            incubation: {
              include: {
                blocks: {
                  include: {
                    ideaBlock: true,
                  },
                  orderBy: { sortOrder: 'asc' },
                },
                rooms: true,
                discussions: true,
              },
            },
          },
        },
        rooms: {
          include: {
            members: true,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project ${slug} not found`);
    }

    const ideaBlocks = project.ideaBlockSources.map(({ ideaBlock }) => ({
      id: ideaBlock.id,
      slug: ideaBlock.slug,
      title: ideaBlock.title,
      summary: ideaBlock.summary,
      blockType: ideaBlock.blockType,
      tags: ideaBlock.tags,
      noveltyNote: ideaBlock.noveltyNote,
      sourceProjects: ideaBlock.sources.map((source) => ({
        slug: source.app.slug,
        name: source.app.name,
      })),
    }));

    const incubations = project.incubationLinks.map(({ incubation }) => ({
      id: incubation.id,
      slug: incubation.slug,
      title: incubation.title,
      oneLiner: incubation.oneLiner,
      status: incubation.status,
      discussionCount: incubation.discussions.length,
      blockCount: incubation.blocks.length,
      roomCount: incubation.rooms.length,
      blocks: incubation.blocks.map((block) => ({
        id: block.ideaBlock.id,
        slug: block.ideaBlock.slug,
        title: block.ideaBlock.title,
      })),
    }));

    return {
      id: project.id,
      slug: project.slug,
      name: project.name,
      tagline: project.tagline,
      category: project.category,
      pricing: project.pricing,
      heatScore: project.heatScore,
      screenshotUrls: project.screenshotUrls,
      overview: {
        saveTimeLabel: project.saveTimeLabel,
        targetPersona: project.targetPersona,
        hookAngle: project.hookAngle,
        trustSignals: project.trustSignals,
        metrics: {
          discussionCount: project.discussions.length,
          ideaBlockCount: ideaBlocks.length,
          incubationCount: incubations.length,
          roomCount: project.rooms.length,
        },
      },
      teardown: project.teardown,
      buildAssets: project.assetBundle,
      discussions: project.discussions.map((discussion) => ({
        id: discussion.id,
        title: discussion.title,
        summary: discussion.summary,
        createdBy: discussion.createdBy,
        likesCount: discussion.likesCount,
        replyCount: discussion.replyCount,
        lastActivityAt: discussion.lastActivityAt,
        createdAt: discussion.createdAt,
        comments: discussion.comments,
      })),
      ideaBlocks,
      incubations,
      rooms: project.rooms.map((room) => ({
        id: room.id,
        slug: room.slug,
        name: room.name,
        goal: room.goal,
        status: room.status,
        memberCount: room.members.length,
        latestMessage: room.messages[0]?.content || null,
      })),
    };
  }
}
