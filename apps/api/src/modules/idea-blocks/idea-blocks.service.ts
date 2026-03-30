import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EngagementTargetType } from '@prisma/client';
import { EngagementService } from '../engagement/engagement.service';
import { PrismaService } from '../prisma/prisma.service';
import { RecommendIdeaProductsDto } from './dto/recommend-idea-products.dto';

@Injectable()
export class IdeaBlocksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly engagementService: EngagementService,
  ) {}

  async findAll(pageRaw?: string, pageSizeRaw?: string, viewerId?: string) {
    const page = Math.max(Number(pageRaw || 1), 1);
    const pageSize = Math.min(Math.max(Number(pageSizeRaw || 20), 1), 50);

    const [total, items] = await this.prisma.$transaction([
      this.prisma.ideaBlock.count(),
      this.prisma.ideaBlock.findMany({
        include: {
          sources: {
            include: {
              app: true,
            },
          },
          incubations: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const states = await this.engagementService.mapStates(
      EngagementTargetType.IDEA_BLOCK,
      items.map((item) => item.id),
      viewerId,
    );

    return {
      items: items.map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        summary: item.summary,
        blockType: item.blockType,
        tags: item.tags,
        noveltyNote: item.noveltyNote,
        sourceProjects: item.sources.map((source) => ({
          slug: source.app.slug,
          name: source.app.name,
        })),
        incubationCount: item.incubations.length,
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
    const block = await this.prisma.ideaBlock.findUnique({
      where: { slug },
      include: {
        sources: {
          include: {
            app: true,
          },
        },
        incubations: {
          include: {
            incubation: true,
          },
        },
      },
    });

    if (!block) {
      throw new NotFoundException(`Idea block ${slug} not found`);
    }

    const state = await this.engagementService.getState(EngagementTargetType.IDEA_BLOCK, block.id, viewerId);

    return {
      id: block.id,
      slug: block.slug,
      title: block.title,
      summary: block.summary,
      blockType: block.blockType,
      tags: block.tags,
      noveltyNote: block.noveltyNote,
      likeCount: state.likeCount,
      favoriteCount: state.favoriteCount,
      viewerHasLiked: state.viewerHasLiked,
      viewerHasFavorited: state.viewerHasFavorited,
      sourceProjects: block.sources.map((source) => ({
        slug: source.app.slug,
        name: source.app.name,
      })),
      incubations: block.incubations.map((entry) => ({
        slug: entry.incubation.slug,
        title: entry.incubation.title,
      })),
    };
  }

  async recommendProducts(dto: RecommendIdeaProductsDto) {
    const blockSlugs = Array.from(new Set((dto.blockSlugs || []).map((slug) => slug.trim()).filter(Boolean))).slice(0, 3);
    if (blockSlugs.length < 2) {
      throw new BadRequestException('At least 2 idea blocks are required');
    }

    const blocks = await this.prisma.ideaBlock.findMany({
      where: { slug: { in: blockSlugs } },
      include: {
        sources: {
          include: {
            app: true,
          },
        },
        incubations: {
          include: {
            incubation: true,
          },
        },
      },
    });

    if (blocks.length < 2) {
      throw new NotFoundException('Selected idea blocks not found');
    }

    const suggestions = (await this.generateWithQwen(blocks)) || this.generateFallbackRecommendations(blocks);
    return { items: suggestions.slice(0, 3) };
  }

  private async generateWithQwen(
    blocks: Array<{
      title: string;
      summary: string;
      blockType: string;
      tags: string[];
      noveltyNote: string | null;
      sources: Array<{ app: { name: string; category: string; tagline: string | null } }>;
      incubations: Array<{ incubation: { title: string } }>;
    }>,
  ) {
    const apiKey = this.configService.get<string>('QWEN_API_KEY');
    if (!apiKey) {
      return null;
    }

    const model = this.configService.get<string>('QWEN_MODEL') || 'qwen-plus';
    const endpoint =
      this.configService.get<string>('QWEN_BASE_URL') ||
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

    const prompt = [
      '你是产品顾问。请根据下面的点子，想出 3 个可以做成产品的方向。',
      '返回严格 JSON，不要 markdown，不要解释。',
      'JSON 结构必须是：{"items":[{"title":"产品名","summary":"一句话介绍"}]}',
      '要求：',
      '1. 名字要简洁，中文为主，不超过 18 个字。',
      '2. 一句话说明这个产品是给谁用的、有什么不同。',
      '3. 输出必须正好 3 个。',
      '点子材料：',
      JSON.stringify(
        blocks.map((block) => ({
          title: block.title,
          summary: block.summary,
          blockType: block.blockType,
          tags: block.tags,
          noveltyNote: block.noveltyNote,
          sourceProjects: block.sources.map((source) => ({
            name: source.app.name,
            category: source.app.category,
            tagline: source.app.tagline,
          })),
          incubationCount: block.incubations.length,
        })),
      ),
    ].join('\n');

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a product ideation assistant that only returns strict JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.9,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        return null;
      }

      const normalized = this.extractJsonObject(content);
      if (!normalized?.items || !Array.isArray(normalized.items)) {
        return null;
      }

      const items = normalized.items
        .filter((item: unknown): item is { title: string; summary: string } => {
          return (
            typeof item === 'object' &&
            item !== null &&
            typeof (item as { title?: unknown }).title === 'string' &&
            typeof (item as { summary?: unknown }).summary === 'string'
          );
        })
        .slice(0, 3);

      return items.length === 3 ? items : null;
    } catch {
      return null;
    }
  }

  private extractJsonObject(content: string) {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]) as { items?: Array<{ title: string; summary: string }> };
    } catch {
      return null;
    }
  }

  private generateFallbackRecommendations(
    blocks: Array<{
      title: string;
      summary: string;
      sources: Array<{ app: { name: string } }>;
    }>,
  ) {
    const titles = blocks.map((block) => block.title);
    const sourceName = blocks[0]?.sources[0]?.app.name || '样本项目';

    return [
      {
        title: `${titles[0]}工作台`,
        summary: `把 ${titles.slice(0, 2).join(' + ')} 做成一个更直接的高频工具，先服务 ${sourceName} 这类已有需求场景。`,
      },
      {
        title: `${titles[titles.length - 1]}轻助手`,
        summary: `保留 ${titles[0]} 的核心机制，再把 ${titles[titles.length - 1]} 变成更低门槛的入口，先试试最小版本。`,
      },
      {
        title: `${titles.slice(0, 2).join(' / ')} 实验版`,
        summary: `围绕 ${titles.join('、')} 做一个更有传播感的 MVP，用内容包装和讨论驱动先拿到第一批反馈。`,
      },
    ];
  }

  async toggleLike(slug: string, userId: string, active?: boolean) {
    const block = await this.prisma.ideaBlock.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!block) {
      throw new NotFoundException(`Idea block ${slug} not found`);
    }

    return this.engagementService.toggleLike(EngagementTargetType.IDEA_BLOCK, block.id, userId, active);
  }

  async toggleFavorite(slug: string, userId: string, active?: boolean) {
    const block = await this.prisma.ideaBlock.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!block) {
      throw new NotFoundException(`Idea block ${slug} not found`);
    }

    return this.engagementService.toggleFavorite(EngagementTargetType.IDEA_BLOCK, block.id, userId, active);
  }
}
