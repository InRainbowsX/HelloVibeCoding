import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JoinRequestStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { CreateIdeaEvidenceDto } from './dto/create-idea-evidence.dto';
import { CreateIdeaMessageDto } from './dto/create-idea-message.dto';
import { CreateJoinRequestDto } from './dto/create-join-request.dto';
import { ListIdeasQueryDto } from './dto/list-ideas-query.dto';

const SORT_MAP: Record<string, Prisma.IdeaOrderByWithRelationInput | Prisma.IdeaOrderByWithRelationInput[]> = {
  featured: [{ featured: 'desc' }, { createdAt: 'desc' }],
  hot: [{ votes: 'desc' }, { createdAt: 'desc' }],
  new: { createdAt: 'desc' },
  novel: [{ isNovel: 'desc' }, { createdAt: 'desc' }],
};

@Injectable()
export class IdeasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListIdeasQueryDto) {
    const page = Math.max(Number(query.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize || 12), 1), 48);
    const search = query.search?.trim();
    const where: Prisma.IdeaWhereInput = {
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { note: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
              { tags: { hasSome: [search] } },
            ],
          }
        : {}),
      ...(query.category ? { category: query.category } : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.idea.count({ where }),
      this.prisma.idea.findMany({
        where,
        include: {
          _count: {
            select: {
              evidence: true,
              joinRequests: true,
              members: true,
              messages: true,
            },
          },
        },
        orderBy: SORT_MAP[query.sort || 'featured'] || SORT_MAP.featured,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        note: item.note,
        category: item.category,
        tags: item.tags,
        featured: item.featured,
        isNovel: item.isNovel,
        novelReason: item.novelReason,
        votes: item.votes,
        createdAt: item.createdAt,
        appCount: item._count.evidence,
        roomCount: item._count.members + item._count.joinRequests + item._count.messages > 0 ? 1 : 0,
      })),
      total,
      page,
      pageSize,
    };
  }

  async create(dto: CreateIdeaDto) {
    if (!dto.title?.trim() || !dto.category?.trim()) {
      throw new BadRequestException('title and category are required');
    }

    const tags = Array.isArray(dto.tags)
      ? dto.tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean).slice(0, 3)
      : [];

    return this.prisma.idea.create({
      data: {
        title: dto.title.trim(),
        category: dto.category.trim(),
        tags,
        note: dto.note?.trim() || null,
      },
    });
  }

  async findOne(id: string, userId?: string) {
    const idea = await this.prisma.idea.findUnique({
      where: { id },
      include: {
        evidence: {
          include: {
            sourceApp: {
              select: {
                id: true,
                slug: true,
                name: true,
                tagline: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
        _count: {
          select: {
            evidence: true,
            joinRequests: true,
            members: true,
            messages: true,
          },
        },
      },
    });

    if (!idea) {
      throw new NotFoundException(`Idea ${id} not found`);
    }

    return {
      id: idea.id,
      title: idea.title,
      note: idea.note,
      category: idea.category,
      tags: idea.tags,
      featured: idea.featured,
      isNovel: idea.isNovel,
      novelReason: idea.novelReason,
      novelTicks: idea.novelTicks,
      votes: idea.votes,
      createdAt: idea.createdAt,
      appCount: idea._count.evidence,
      roomCount: idea._count.members + idea._count.joinRequests + idea._count.messages > 0 ? 1 : 0,
      joinStatus: await this.getJoinStatusValue(id, userId),
      evidence: idea.evidence.map((item) => ({
        id: item.id,
        sourceAppId: item.sourceAppId,
        appTitle: item.appTitle,
        appUrl: item.appUrl,
        platform: item.platform,
        iconUrl: item.iconUrl,
        screenshotUrls: item.screenshotUrls,
        fetchStatus: item.fetchStatus,
        fetchNote: item.fetchNote,
        how: item.how,
        cpHook: item.cpHook,
        cpWow: item.cpWow,
        cpReturn: item.cpReturn,
        createdAt: item.createdAt,
        sourceApp: item.sourceApp,
      })),
      messages: idea.messages,
    };
  }

  async listEvidence(ideaId: string) {
    await this.ensureIdeaExists(ideaId);
    return this.prisma.ideaEvidence.findMany({
      where: { ideaId },
      include: {
        sourceApp: {
          select: {
            id: true,
            slug: true,
            name: true,
            tagline: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createEvidence(ideaId: string, dto: CreateIdeaEvidenceDto) {
    await this.ensureIdeaExists(ideaId);

    if (!dto.appTitle?.trim() || !dto.appUrl?.trim() || !dto.platform?.trim() || !dto.how?.trim() || !dto.cpHook?.trim() || !dto.cpWow?.trim() || !dto.cpReturn?.trim()) {
      throw new BadRequestException('appTitle, appUrl, platform, how, cpHook, cpWow and cpReturn are required');
    }

    if (dto.sourceAppId) {
      const sourceApp = await this.prisma.app.findUnique({ where: { id: dto.sourceAppId } });
      if (!sourceApp) {
        throw new NotFoundException(`App ${dto.sourceAppId} not found`);
      }
    }

    return this.prisma.ideaEvidence.create({
      data: {
        ideaId,
        sourceAppId: dto.sourceAppId?.trim() || null,
        appTitle: dto.appTitle.trim(),
        appUrl: dto.appUrl.trim(),
        platform: dto.platform.trim(),
        iconUrl: this.optionalUrl(dto.iconUrl) || this.defaultFavicon(dto.appUrl.trim()),
        screenshotUrls: this.urlArray(dto.screenshotUrls, 5),
        fetchStatus: this.optionalString(dto.fetchStatus)?.toUpperCase() || 'MANUAL',
        fetchNote: this.optionalString(dto.fetchNote),
        how: dto.how.trim(),
        cpHook: dto.cpHook.trim(),
        cpWow: dto.cpWow.trim(),
        cpReturn: dto.cpReturn.trim(),
      },
    });
  }

  async deleteEvidence(ideaId: string, evidenceId: string) {
    const record = await this.prisma.ideaEvidence.findUnique({ where: { id: evidenceId } });
    if (!record || record.ideaId !== ideaId) {
      throw new NotFoundException(`Evidence ${evidenceId} not found`);
    }

    await this.prisma.ideaEvidence.delete({ where: { id: evidenceId } });
    return { success: true };
  }

  async getEvidenceDetail(ideaId: string, evidenceId: string) {
    const evidence = await this.prisma.ideaEvidence.findFirst({
      where: { id: evidenceId, ideaId },
      include: {
        sourceApp: {
          select: { id: true, slug: true, name: true, tagline: true },
        },
      },
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence ${evidenceId} not found`);
    }

    const scraped = await this.scrapeEvidenceAppMeta(evidence.appUrl);

    return {
      id: evidence.id,
      ideaId: evidence.ideaId,
      appTitle: evidence.appTitle,
      appUrl: evidence.appUrl,
      platform: evidence.platform,
      how: evidence.how,
      cpHook: evidence.cpHook,
      cpWow: evidence.cpWow,
      cpReturn: evidence.cpReturn,
      iconUrl: scraped.iconUrl || evidence.iconUrl || this.defaultFavicon(evidence.appUrl),
      screenshotUrls: scraped.screenshotUrls.length ? scraped.screenshotUrls : evidence.screenshotUrls,
      description: scraped.description || '',
      metrics: scraped.metrics,
      sourceApp: evidence.sourceApp,
      fetchedAt: new Date().toISOString(),
    };
  }

  async createJoinRequest(ideaId: string, dto: CreateJoinRequestDto) {
    await this.ensureIdeaExists(ideaId);

    if (!dto.userId?.trim() || !dto.userName?.trim() || !dto.q1Contrib?.trim() || !dto.q2Improve?.trim() || !dto.q3FirstStep?.trim()) {
      throw new BadRequestException('userId, userName, q1Contrib, q2Improve and q3FirstStep are required');
    }

    const member = await this.prisma.member.findUnique({
      where: {
        ideaId_userId: {
          ideaId,
          userId: dto.userId.trim(),
        },
      },
    });

    if (member) {
      return {
        id: member.id,
        ideaId,
        userId: member.userId,
        userName: member.userName,
        status: 'APPROVED',
      };
    }

    return this.prisma.joinRequest.upsert({
      where: {
        ideaId_userId: {
          ideaId,
          userId: dto.userId.trim(),
        },
      },
      update: {
        userName: dto.userName.trim(),
        q1Contrib: dto.q1Contrib.trim(),
        q2Improve: dto.q2Improve.trim(),
        q3FirstStep: dto.q3FirstStep.trim(),
        status: JoinRequestStatus.PENDING,
      },
      create: {
        ideaId,
        userId: dto.userId.trim(),
        userName: dto.userName.trim(),
        q1Contrib: dto.q1Contrib.trim(),
        q2Improve: dto.q2Improve.trim(),
        q3FirstStep: dto.q3FirstStep.trim(),
      },
    });
  }

  async getJoinStatus(ideaId: string, userId?: string) {
    await this.ensureIdeaExists(ideaId);
    return {
      status: await this.getJoinStatusValue(ideaId, userId),
    };
  }

  async listMessages(ideaId: string) {
    await this.ensureIdeaExists(ideaId);
    return this.prisma.ideaMessage.findMany({
      where: { ideaId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  async createMessage(ideaId: string, dto: CreateIdeaMessageDto) {
    await this.ensureIdeaExists(ideaId);

    if (!dto.userId?.trim() || !dto.userName?.trim() || !dto.content?.trim()) {
      throw new BadRequestException('userId, userName and content are required');
    }

    const member = await this.prisma.member.findUnique({
      where: {
        ideaId_userId: {
          ideaId,
          userId: dto.userId.trim(),
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('需要申请加入');
    }

    return this.prisma.ideaMessage.create({
      data: {
        ideaId,
        userId: dto.userId.trim(),
        userName: dto.userName.trim(),
        content: dto.content.trim(),
      },
    });
  }

  private async ensureIdeaExists(id: string) {
    const idea = await this.prisma.idea.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!idea) {
      throw new NotFoundException(`Idea ${id} not found`);
    }
  }

  private async getJoinStatusValue(ideaId: string, userId?: string) {
    if (!userId?.trim()) {
      return 'none';
    }

    const member = await this.prisma.member.findUnique({
      where: {
        ideaId_userId: {
          ideaId,
          userId: userId.trim(),
        },
      },
    });

    if (member) {
      return 'approved';
    }

    const request = await this.prisma.joinRequest.findUnique({
      where: {
        ideaId_userId: {
          ideaId,
          userId: userId.trim(),
        },
      },
    });

    if (!request) {
      return 'none';
    }

    return request.status.toLowerCase();
  }

  private optionalString(value: unknown) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private optionalUrl(value: unknown) {
    const parsed = this.optionalString(value);
    if (!parsed) return null;
    return /^https?:\/\//i.test(parsed) ? parsed : null;
  }

  private urlArray(value: unknown, limit = 5) {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => /^https?:\/\//i.test(item))
      .slice(0, limit);
  }

  private defaultFavicon(appUrl: string) {
    try {
      const url = new URL(appUrl);
      return `${url.origin}/favicon.ico`;
    } catch {
      return null;
    }
  }

  private async scrapeEvidenceAppMeta(appUrl: string) {
    const fallback = {
      iconUrl: this.defaultFavicon(appUrl),
      screenshotUrls: [] as string[],
      description: '',
      metrics: {
        ratingValue: '',
        ratingCount: '',
        age: '',
        category: '',
        developer: '',
        language: '',
        size: '',
      },
    };

    try {
      const response = await fetch(appUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          accept: 'text/html,application/xhtml+xml',
        },
      });

      if (!response.ok) return fallback;
      const html = await response.text();
      const ld = this.extractJsonLdObjects(html);
      const appLd = this.pickSoftwareApplication(ld);
      const iconUrl =
        this.getDeepString(appLd, ['image']) ||
        this.extractMetaContent(html, ['og:image']) ||
        this.extractIconUrl(html, appUrl) ||
        fallback.iconUrl;
      const screenshots = this.extractScreenshots(appLd, html, appUrl).slice(0, 12);
      const description = this.extractDescription(appLd, html);

      return {
        iconUrl,
        screenshotUrls: screenshots,
        description,
        metrics: {
          ratingValue: this.getDeepString(appLd, ['aggregateRating', 'ratingValue']) || '',
          ratingCount:
            this.getDeepString(appLd, ['aggregateRating', 'ratingCount']) ||
            this.getDeepString(appLd, ['aggregateRating', 'reviewCount']) ||
            '',
          age: this.getDeepString(appLd, ['contentRating']) || this.extractAppStoreAge(html) || '',
          category: this.getDeepString(appLd, ['applicationCategory']) || this.extractAppStoreCategory(html) || '',
          developer:
            this.getDeepString(appLd, ['author', 'name']) ||
            this.getDeepString(appLd, ['publisher', 'name']) ||
            this.extractAppStoreDeveloper(html) ||
            '',
          language:
            this.getDeepString(appLd, ['inLanguage']) ||
            this.extractAppStoreLanguage(html) ||
            '',
          size: this.getDeepString(appLd, ['fileSize']) || this.extractAppStoreSize(html) || '',
        },
      };
    } catch {
      return fallback;
    }
  }

  private extractJsonLdObjects(html: string) {
    const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    const objects: unknown[] = [];
    for (const match of matches) {
      const raw = match[1]?.trim();
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          objects.push(...parsed);
        } else {
          objects.push(parsed);
        }
      } catch {
        continue;
      }
    }
    return objects;
  }

  private pickSoftwareApplication(objects: unknown[]) {
    return objects.find((item) => {
      if (!item || typeof item !== 'object') return false;
      const type = (item as Record<string, unknown>)['@type'];
      if (Array.isArray(type)) return type.some((entry) => String(entry).includes('SoftwareApplication'));
      return String(type || '').includes('SoftwareApplication');
    }) as Record<string, unknown> | undefined;
  }

  private extractMetaContent(html: string, names: string[]) {
    for (const name of names) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
      const matched = html.match(pattern);
      if (matched?.[1]) return matched[1].trim();
    }
    return '';
  }

  private extractIconUrl(html: string, baseUrl: string) {
    const iconRegex = /<link[^>]+rel=["'][^"']*(?:icon|apple-touch-icon)[^"']*["'][^>]*>/gi;
    const iconTag = html.match(iconRegex)?.[0];
    if (!iconTag) return '';
    const href = iconTag.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) return '';
    return this.toAbsoluteUrl(href, baseUrl);
  }

  private extractScreenshots(appLd: Record<string, unknown> | undefined, html: string, baseUrl: string) {
    const candidates: string[] = [];
    const ldScreens = appLd?.screenshot;
    if (Array.isArray(ldScreens)) {
      for (const item of ldScreens) {
        if (typeof item === 'string') candidates.push(item);
      }
    } else if (typeof ldScreens === 'string') {
      candidates.push(ldScreens);
    }

    const imgMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
    for (const match of imgMatches.slice(0, 50)) {
      const src = match[1];
      if (!src) continue;
      if (/screenshot|screen|shot|image/i.test(src)) candidates.push(src);
    }

    // App Store 页面常见资源域名，优先抓应用截图分辨率图。
    const appStoreImageMatches = [
      ...html.matchAll(/https:\/\/is\d-ssl\.mzstatic\.com\/image\/thumb\/[^"' )]+/gi),
      ...html.matchAll(/https:\/\/is\d-ssl\.mzstatic\.com\/image\/thumb\/[^"' )]+\.webp/gi),
    ];
    for (const match of appStoreImageMatches) {
      if (match[0]) candidates.push(match[0]);
    }

    const abs = candidates
      .map((item) => this.toAbsoluteUrl(item, baseUrl))
      .filter(Boolean)
      .filter((item) => /^https?:\/\//i.test(item))
      .filter((item) => !/supports-|platforms-|badge|placeholder/i.test(item))
      .filter((item) => /(\d+x\d+w\.(png|jpg|jpeg|webp)|\d+x\d+bb(-\d+)?\.(png|jpg|jpeg|webp)|\/source\/)/i.test(item))
      .filter((item) => this.isLikelyScreenshotUrl(item));

    return Array.from(new Set(abs));
  }

  private extractDescription(appLd: Record<string, unknown> | undefined, html: string) {
    const fromLd = typeof appLd?.description === 'string' ? appLd.description.trim() : '';
    if (fromLd) return fromLd;
    const fromMeta = this.extractMetaContent(html, ['description', 'og:description', 'twitter:description']);
    return fromMeta || '';
  }

  private extractByLabel(html: string, label: string) {
    const pattern = new RegExp(`${label}[\\s\\S]{0,120}?([A-Za-z0-9.+\\- ]{1,32})`, 'i');
    const matched = html.match(pattern)?.[1];
    return matched ? matched.trim() : '';
  }

  private extractAppStoreTermText(html: string, term: string) {
    const marker = `>${term.toLowerCase()}<`;
    const index = html.toLowerCase().indexOf(marker);
    if (index < 0) return '';
    const block = html.slice(index, index + 1600);
    return block
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractAppStoreAge(html: string) {
    const text = this.extractAppStoreTermText(html, 'Ages');
    return text.match(/Ages\s+([0-9]+\+)/i)?.[1] || '';
  }

  private extractAppStoreLanguage(html: string) {
    const text = this.extractAppStoreTermText(html, 'Language');
    const primary = text.match(/Language\s+([A-Z]{2})\b/)?.[1] || '';
    const more = text.match(/\+\s*([0-9]+)\s*More/i)?.[1] || '';
    if (primary && more) return `${primary} + ${more} More`;
    return primary;
  }

  private extractAppStoreSize(html: string) {
    const text = this.extractAppStoreTermText(html, 'Size');
    const full = text.match(/Size\s+([0-9]+(?:\.[0-9]+)?)\s*(MB|GB|KB)/i);
    if (full) return `${full[1]} ${full[2].toUpperCase()}`;
    const numberOnly = text.match(/Size\s+([0-9]+(?:\.[0-9]+)?)/i)?.[1];
    const unit = text.match(/\b(MB|GB|KB)\b/i)?.[1];
    if (numberOnly && unit) return `${numberOnly} ${unit.toUpperCase()}`;
    return '';
  }

  private extractAppStoreDeveloper(html: string) {
    const text = this.extractAppStoreTermText(html, 'Developer');
    const matched = text.match(/Developer\s+([A-Za-z0-9 .&'\-]{2,80})/i)?.[1] || '';
    return matched.replace(/\s{2,}/g, ' ').trim();
  }

  private extractAppStoreCategory(html: string) {
    const text = this.extractAppStoreTermText(html, 'Category');
    return text.match(/Category\s+([A-Za-z][A-Za-z ]{1,40})/)?.[1]?.trim() || '';
  }

  private isLikelyScreenshotUrl(url: string) {
    const matched = url.match(/\/(\d+)x(\d+)bb/i);
    if (!matched) return true;
    const width = Number(matched[1]);
    const height = Number(matched[2]);
    if (!Number.isFinite(width) || !Number.isFinite(height)) return true;
    return width >= 140 && height >= 280;
  }

  private getDeepString(input: Record<string, unknown> | undefined, path: string[]) {
    let current: unknown = input;
    for (const segment of path) {
      if (!current || typeof current !== 'object') return '';
      current = (current as Record<string, unknown>)[segment];
    }
    if (typeof current === 'string' || typeof current === 'number') return String(current).trim();
    return '';
  }

  private toAbsoluteUrl(value: string, baseUrl: string) {
    const normalized = value.trim();
    if (!normalized) return '';
    if (/^https?:\/\//i.test(normalized)) return normalized;
    if (normalized.startsWith('//')) return `https:${normalized}`;
    try {
      return new URL(normalized, baseUrl).toString();
    } catch {
      return '';
    }
  }
}
