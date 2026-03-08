import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PatternsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const items = await this.prisma.pattern.findMany({
      include: {
        apps: {
          select: { id: true },
        },
      },
      orderBy: [{ apps: { _count: 'desc' } }, { createdAt: 'desc' }],
    });

    return {
      items: items.map((pattern) => ({
        id: pattern.id,
        slug: pattern.slug,
        name: pattern.name,
        description: pattern.description,
        useCases: pattern.useCases,
        appCount: pattern.apps.length,
      })),
      total: items.length,
    };
  }

  async findOne(slug: string) {
    const pattern = await this.prisma.pattern.findUnique({
      where: { slug },
      include: {
        apps: {
          orderBy: { heatScore: 'desc' },
        },
        discussions: {
          include: {
            comments: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!pattern) {
      throw new NotFoundException(`Pattern ${slug} not found`);
    }

    return {
      id: pattern.id,
      slug: pattern.slug,
      name: pattern.name,
      description: pattern.description,
      useCases: pattern.useCases,
      apps: pattern.apps.map((app) => ({
        slug: app.slug,
        name: app.name,
        pricing: app.pricing,
        heatScore: app.heatScore,
      })),
      discussions: pattern.discussions,
      createdAt: pattern.createdAt,
      updatedAt: pattern.updatedAt,
    };
  }
}
