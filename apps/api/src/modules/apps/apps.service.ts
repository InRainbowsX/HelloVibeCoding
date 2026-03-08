import { Injectable, NotFoundException } from '@nestjs/common';
import { PricingModel, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListAppsQueryDto } from './dto/list-apps-query.dto';

const SORT_MAP: Record<string, Prisma.AppOrderByWithRelationInput | Prisma.AppOrderByWithRelationInput[]> = {
  hot: { heatScore: 'desc' },
  latest: { createdAt: 'desc' },
  difficulty: [{ difficulty: 'asc' }, { heatScore: 'desc' }],
};

@Injectable()
export class AppsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListAppsQueryDto) {
    const page = Math.max(Number(query.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize || 12), 1), 48);

    const where: Prisma.AppWhereInput = {
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { tagline: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.pattern ? { pattern: { slug: query.pattern } } : {}),
      ...(query.pricing && this.isPricing(query.pricing) ? { pricing: query.pricing } : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.app.count({ where }),
      this.prisma.app.findMany({
        where,
        include: {
          pattern: true,
          teardown: true,
          ideaEvidence: {
            include: {
              idea: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
          discussions: {
            orderBy: { createdAt: 'desc' },
            take: 2,
          },
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
        saveTimeLabel: item.saveTimeLabel,
        category: item.category,
        pricing: item.pricing,
        channels: item.channels,
        targetPersona: item.targetPersona,
        hookAngle: item.hookAngle,
        trustSignals: item.trustSignals,
        difficulty: item.difficulty,
        heatScore: item.heatScore,
        pattern: item.pattern
          ? { slug: item.pattern.slug, name: item.pattern.name }
          : null,
        coldStartHighlight: item.teardown?.coldStartStrategy || item.hookAngle || null,
        discussionCount: item.discussions.length,
        relatedIdeas: item.ideaEvidence.map((evidence) => ({
          id: evidence.idea.id,
          title: evidence.idea.title,
        })),
        createdAt: item.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(slug: string) {
    const app = await this.prisma.app.findUnique({
      where: { slug },
      include: {
        pattern: {
          include: {
            apps: {
              where: { slug: { not: slug } },
              take: 4,
              orderBy: { heatScore: 'desc' },
            },
          },
        },
        discussions: {
          include: {
            comments: {
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        teardown: true,
        assetBundle: true,
      },
    });

    if (!app) {
      throw new NotFoundException(`App ${slug} not found`);
    }

    return {
      id: app.id,
      slug: app.slug,
      name: app.name,
      tagline: app.tagline,
      saveTimeLabel: app.saveTimeLabel,
      category: app.category,
      pricing: app.pricing,
      channels: app.channels,
      targetPersona: app.targetPersona,
      hookAngle: app.hookAngle,
      trustSignals: app.trustSignals,
      difficulty: app.difficulty,
      heatScore: app.heatScore,
      screenshotUrls: app.screenshotUrls,
      breakdown: {
        painAndPersona: app.teardown?.painSummary ?? null,
        triggerScene: app.teardown?.triggerScene ?? null,
        corePromise: app.teardown?.corePromise ?? null,
        ahaMoment: app.hookAngle,
        retentionLoop: app.teardown?.coreLoop ?? null,
        growthEngine: app.teardown?.coldStartStrategy ?? null,
        monetization: app.teardown?.pricingLogic ?? null,
        moat: app.teardown?.competitorDelta ?? null,
      },
      teardown: app.teardown
        ? {
            painSummary: app.teardown.painSummary,
            painScore: app.teardown.painScore,
            triggerScene: app.teardown.triggerScene,
            corePromise: app.teardown.corePromise,
            coreLoop: app.teardown.coreLoop,
            keyConstraints: app.teardown.keyConstraints,
            mvpScope: app.teardown.mvpScope,
            dataInput: app.teardown.dataInput,
            dataOutput: app.teardown.dataOutput,
            faultTolerance: app.teardown.faultTolerance,
            coldStartStrategy: app.teardown.coldStartStrategy,
            pricingLogic: app.teardown.pricingLogic,
            competitorDelta: app.teardown.competitorDelta,
            riskNotes: app.teardown.riskNotes,
            expansionSteps: app.teardown.expansionSteps,
            reverseIdeas: app.teardown.reverseIdeas,
          }
        : null,
      buildAssets: {
        hasAgentsTemplate: app.assetBundle?.hasAgentsTemplate ?? false,
        hasSpecTemplate: app.assetBundle?.hasSpecTemplate ?? false,
        hasPromptPack: app.assetBundle?.hasPromptPack ?? false,
        agentsTemplate: app.assetBundle?.agentsTemplate ?? null,
        specTemplate: app.assetBundle?.specTemplate ?? null,
        promptPack: app.assetBundle?.promptPack ?? null,
      },
      pattern: app.pattern
        ? {
            id: app.pattern.id,
            slug: app.pattern.slug,
            name: app.pattern.name,
            description: app.pattern.description,
            relatedApps: app.pattern.apps.map((related) => ({
              slug: related.slug,
              name: related.name,
              heatScore: related.heatScore,
            })),
          }
        : null,
      discussions: app.discussions.map((discussion) => ({
        id: discussion.id,
        title: discussion.title,
        likesCount: discussion.likesCount,
        createdAt: discussion.createdAt,
        comments: discussion.comments,
      })),
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    };
  }

  private isPricing(value: string): value is PricingModel {
    return Object.values(PricingModel).includes(value as PricingModel);
  }
}
