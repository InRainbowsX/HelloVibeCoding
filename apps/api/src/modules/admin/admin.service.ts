import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JoinRequestStatus, PricingModel, Prisma, SubmissionStatus } from '@prisma/client';
import sharp = require('sharp');
import { PrismaService } from '../prisma/prisma.service';
import { ReviewSubmissionDto } from './dto/review-submission.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listSubmissions(status?: string) {
    const where = status && this.isSubmissionStatus(status) ? { status } : {};
    return this.prisma.submission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewSubmission(id: string, dto: ReviewSubmissionDto) {
    if (!this.isSubmissionStatus(dto.status)) {
      throw new BadRequestException('status must be APPROVED or REJECTED');
    }

    const submission = await this.prisma.submission.findUnique({ where: { id } });
    if (!submission) {
      throw new NotFoundException(`Submission ${id} not found`);
    }

    const updated = await this.prisma.submission.update({
      where: { id },
      data: { status: dto.status },
    });

    let createdApp = null;

    if (dto.status === SubmissionStatus.APPROVED) {
      const slug = (dto.slug?.trim() || this.toSlug(submission.productName)).slice(0, 80);
      const pattern = submission.selectedPattern
        ? await this.prisma.pattern.findUnique({ where: { slug: submission.selectedPattern } })
        : null;

      createdApp = await this.prisma.app.upsert({
        where: { slug },
        update: {
          name: submission.productName,
          targetPersona: '待补充真实目标用户',
          saveTimeLabel: '替用户省下一次重复操作的 30 秒。',
          category: '效率',
          hookAngle: '待补充新的切入壳子',
          trustSignals: ['可在线体验'],
          screenshotUrls: submission.screenshotUrl ? [submission.screenshotUrl] : [],
          patternId: pattern?.id,
        },
        create: {
          slug,
          name: submission.productName,
          tagline: '审核通过后自动生成的草稿条目',
          saveTimeLabel: '替用户省下一次重复操作的 30 秒。',
          category: '效率',
          pricing: PricingModel.FREEMIUM,
          channels: ['community'],
          targetPersona: '待补充真实目标用户',
          hookAngle: '待补充新的切入壳子',
          trustSignals: ['可在线体验'],
          difficulty: 2,
          heatScore: 0,
          screenshotUrls: submission.screenshotUrl ? [submission.screenshotUrl] : [],
          patternId: pattern?.id,
        },
      });

      await this.prisma.teardown.upsert({
        where: { appId: createdApp.id },
        update: this.defaultTeardownData(),
        create: {
          appId: createdApp.id,
          ...this.defaultTeardownData(),
        },
      });

      await this.prisma.appAssetBundle.upsert({
        where: { appId: createdApp.id },
        update: this.defaultAssetBundleData(),
        create: {
          appId: createdApp.id,
          ...this.defaultAssetBundleData(),
        },
      });
    }

    return {
      submission: updated,
      createdApp,
    };
  }

  async deleteSubmission(id: string) {
    const submission = await this.prisma.submission.findUnique({ where: { id } });
    if (!submission) {
      throw new NotFoundException(`Submission ${id} not found`);
    }

    await this.prisma.submission.delete({ where: { id } });
    return { success: true };
  }

  async listJoinRequests(status?: string) {
    const normalizedStatus = typeof status === 'string' ? status.trim().toUpperCase() : '';
    const where =
      normalizedStatus && this.isJoinRequestStatus(normalizedStatus)
        ? { status: normalizedStatus }
        : {};

    const items = await this.prisma.joinRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return { items };
  }

  async approveJoinRequest(id: string) {
    const request = await this.prisma.joinRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Join request ${id} not found`);
    }

    const [updatedRequest, member] = await this.prisma.$transaction([
      this.prisma.joinRequest.update({
        where: { id },
        data: { status: JoinRequestStatus.APPROVED },
      }),
      this.prisma.member.upsert({
        where: {
          ideaId_userId: {
            ideaId: request.ideaId,
            userId: request.userId,
          },
        },
        update: {
          userName: request.userName,
        },
        create: {
          ideaId: request.ideaId,
          userId: request.userId,
          userName: request.userName,
        },
      }),
    ]);

    return {
      request: updatedRequest,
      member,
    };
  }

  async rejectJoinRequest(id: string) {
    const request = await this.prisma.joinRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Join request ${id} not found`);
    }

    const updatedRequest = await this.prisma.joinRequest.update({
      where: { id },
      data: { status: JoinRequestStatus.REJECTED },
    });

    return { request: updatedRequest };
  }

  async updateIdea(id: string, payload: Record<string, unknown>) {
    const idea = await this.prisma.idea.findUnique({ where: { id } });
    if (!idea) {
      throw new NotFoundException(`Idea ${id} not found`);
    }

    return this.prisma.idea.update({
      where: { id },
      data: {
        ...(payload.featured !== undefined ? { featured: Boolean(payload.featured) } : {}),
        ...(payload.isNovel !== undefined ? { isNovel: Boolean(payload.isNovel) } : {}),
        ...(payload.novelReason !== undefined
          ? {
              novelReason:
                typeof payload.novelReason === 'string' && payload.novelReason.trim()
                  ? payload.novelReason.trim()
                  : null,
            }
          : {}),
        ...(payload.novelTicks !== undefined ? { novelTicks: this.stringArray(payload.novelTicks).slice(0, 5) } : {}),
      },
    });
  }

  async fetchEvidenceDraft(payload: Record<string, unknown>) {
    const appUrl = this.requiredString(payload.url ?? payload.appUrl, 'url');
    if (!/^https?:\/\//i.test(appUrl)) {
      throw new BadRequestException('url must start with http:// or https://');
    }

    const platform = this.guessPlatform(appUrl);
    const fallbackTitle = this.fallbackTitleFromUrl(appUrl);
    const defaultIcon = this.defaultFavicon(appUrl);

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

      if (!response.ok) {
        return {
          appUrl,
          platform,
          appTitle: fallbackTitle,
          iconUrl: defaultIcon,
          screenshotUrls: [],
          fetchStatus: 'PARTIAL',
          fetchNote: `抓取失败：HTTP ${response.status}`,
        };
      }

      const html = await response.text();
      const appTitle =
        this.extractMetaContent(html, ['og:title', 'twitter:title']) ||
        this.extractTitleTag(html) ||
        fallbackTitle;
      const iconUrl = this.extractIconUrl(html, appUrl) || defaultIcon;
      const screenshotUrls = this.extractScreenshotCandidates(html, appUrl).slice(0, 5);

      return {
        appUrl,
        platform,
        appTitle,
        iconUrl,
        screenshotUrls,
        fetchStatus: screenshotUrls.length > 0 ? 'OK' : 'PARTIAL',
        fetchNote: screenshotUrls.length > 0 ? '已抓到封面/截图候选，可直接编辑后保存。' : '只抓到基础信息，截图可手动补充。',
      };
    } catch (error) {
      return {
        appUrl,
        platform,
        appTitle: fallbackTitle,
        iconUrl: defaultIcon,
        screenshotUrls: [],
        fetchStatus: 'PARTIAL',
        fetchNote: `抓取异常：${error instanceof Error ? error.message : 'unknown error'}`,
      };
    }
  }

  async listApps() {
    const items = await this.prisma.app.findMany({
      include: {
        pattern: true,
        teardown: true,
        assetBundle: true,
        _count: {
          select: {
            discussions: true,
            ideaBlockSources: true,
            incubationLinks: true,
            rooms: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { 
      items: items.map(item => ({
        ...item,
        discussionCount: item._count.discussions,
        ideaBlockCount: item._count.ideaBlockSources,
        incubationCount: item._count.incubationLinks,
        roomCount: item._count.rooms,
        _count: undefined,
      })), 
      total: items.length 
    };
  }

  async getAppDetail(id: string) {
    const app = await this.prisma.app.findUnique({
      where: { id },
      include: {
        pattern: true,
        teardown: true,
        assetBundle: true,
        discussions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            summary: true,
            likesCount: true,
            replyCount: true,
            createdAt: true,
          },
        },
        incubationLinks: {
          include: {
            incubation: {
              select: {
                id: true,
                slug: true,
                title: true,
                oneLiner: true,
                status: true,
              },
            },
          },
        },
        ideaBlockSources: {
          include: {
            ideaBlock: {
              select: {
                id: true,
                slug: true,
                title: true,
                blockType: true,
                summary: true,
              },
            },
          },
        },
        rooms: {
          take: 10,
          select: {
            id: true,
            slug: true,
            name: true,
            goal: true,
            status: true,
          },
        },
      },
    });

    if (!app) {
      throw new NotFoundException(`App ${id} not found`);
    }

    return app;
  }

  async updateTeardown(appId: string, payload: Record<string, unknown>) {
    const app = await this.prisma.app.findUnique({ where: { id: appId } });
    if (!app) {
      throw new NotFoundException(`App ${appId} not found`);
    }

    const teardownData = this.buildTeardownData(payload);
    
    const teardown = await this.prisma.teardown.upsert({
      where: { appId },
      update: teardownData,
      create: {
        appId,
        ...teardownData,
      },
    });

    return teardown;
  }

  async updateAssetBundle(appId: string, payload: Record<string, unknown>) {
    const app = await this.prisma.app.findUnique({ where: { id: appId } });
    if (!app) {
      throw new NotFoundException(`App ${appId} not found`);
    }

    const assetData = this.buildAssetBundleData(payload);
    
    const assetBundle = await this.prisma.appAssetBundle.upsert({
      where: { appId },
      update: assetData,
      create: {
        appId,
        ...assetData,
      },
    });

    return assetBundle;
  }

  async createApp(payload: Record<string, unknown>) {
    const data = this.buildAppCreateData(payload);
    const created = await this.prisma.app.create({ data });
    await this.upsertNestedAppData(created.id, payload);
    return this.getAdminApp(created.id);
  }

  async updateApp(id: string, payload: Record<string, unknown>) {
    const existing = await this.prisma.app.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`App ${id} not found`);
    }

    await this.prisma.app.update({
      where: { id },
      data: this.buildAppUpdateData(payload),
    });
    await this.upsertNestedAppData(id, payload);
    return this.getAdminApp(id);
  }

  async deleteApp(id: string) {
    const app = await this.prisma.app.findUnique({ where: { id } });
    if (!app) {
      throw new NotFoundException(`App ${id} not found`);
    }

    const discussions = await this.prisma.discussion.findMany({
      where: { appId: id },
      select: { id: true },
    });
    const discussionIds = discussions.map((item) => item.id);

    await this.prisma.$transaction(async (tx) => {
      if (discussionIds.length > 0) {
        await tx.comment.deleteMany({ where: { discussionId: { in: discussionIds } } });
        await tx.discussion.deleteMany({ where: { id: { in: discussionIds } } });
      }
      await tx.teardown.deleteMany({ where: { appId: id } });
      await tx.appAssetBundle.deleteMany({ where: { appId: id } });
      await tx.app.delete({ where: { id } });
    });

    return { success: true };
  }

  async listPatterns() {
    return this.prisma.pattern.findMany({
      include: {
        apps: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPattern(payload: Record<string, unknown>) {
    const slug = this.requiredString(payload.slug, 'slug');
    const name = this.requiredString(payload.name, 'name');
    const pattern = await this.prisma.pattern.create({
      data: {
        slug,
        name,
        description: this.optionalString(payload.description) || '待补充模式说明',
        useCases: this.stringArray(payload.useCases),
      },
    });

    return this.prisma.pattern.findUnique({
      where: { id: pattern.id },
      include: { apps: { select: { id: true, name: true, slug: true } } },
    });
  }

  async updatePattern(id: string, payload: Record<string, unknown>) {
    const pattern = await this.prisma.pattern.findUnique({ where: { id } });
    if (!pattern) {
      throw new NotFoundException(`Pattern ${id} not found`);
    }

    await this.prisma.pattern.update({
      where: { id },
      data: {
        ...(payload.slug !== undefined ? { slug: this.requiredString(payload.slug, 'slug') } : {}),
        ...(payload.name !== undefined ? { name: this.requiredString(payload.name, 'name') } : {}),
        ...(payload.description !== undefined ? { description: this.optionalString(payload.description) || '' } : {}),
        ...(payload.useCases !== undefined ? { useCases: this.stringArray(payload.useCases) } : {}),
      },
    });

    return this.prisma.pattern.findUnique({
      where: { id },
      include: { apps: { select: { id: true, name: true, slug: true } } },
    });
  }

  async deletePattern(id: string) {
    const pattern = await this.prisma.pattern.findUnique({ where: { id } });
    if (!pattern) {
      throw new NotFoundException(`Pattern ${id} not found`);
    }

    const discussions = await this.prisma.discussion.findMany({
      where: { patternId: id },
      select: { id: true },
    });
    const discussionIds = discussions.map((item) => item.id);

    await this.prisma.$transaction(async (tx) => {
      await tx.app.updateMany({
        where: { patternId: id },
        data: { patternId: null },
      });
      if (discussionIds.length > 0) {
        await tx.comment.deleteMany({ where: { discussionId: { in: discussionIds } } });
        await tx.discussion.deleteMany({ where: { id: { in: discussionIds } } });
      }
      await tx.pattern.delete({ where: { id } });
    });

    return { success: true };
  }

  async listDiscussions() {
    const items = await this.prisma.discussion.findMany({
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { items, total: items.length };
  }

  async updateDiscussion(id: string, payload: Record<string, unknown>) {
    const discussion = await this.prisma.discussion.findUnique({ where: { id } });
    if (!discussion) {
      throw new NotFoundException(`Discussion ${id} not found`);
    }

    await this.prisma.discussion.update({
      where: { id },
      data: {
        ...(payload.title !== undefined ? { title: this.requiredString(payload.title, 'title') } : {}),
        ...(payload.likesCount !== undefined ? { likesCount: this.nonNegativeInt(payload.likesCount, 'likesCount') } : {}),
      },
    });

    return this.prisma.discussion.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async deleteDiscussion(id: string) {
    const discussion = await this.prisma.discussion.findUnique({ where: { id } });
    if (!discussion) {
      throw new NotFoundException(`Discussion ${id} not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.comment.deleteMany({ where: { discussionId: id } });
      await tx.discussion.delete({ where: { id } });
    });

    return { success: true };
  }

  async listSubscribers() {
    return this.prisma.subscriber.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSubscriber(payload: Record<string, unknown>) {
    const email = this.requiredEmail(payload.email, 'email');
    return this.prisma.subscriber.create({
      data: { email },
    });
  }

  async updateSubscriber(id: string, payload: Record<string, unknown>) {
    const subscriber = await this.prisma.subscriber.findUnique({ where: { id } });
    if (!subscriber) {
      throw new NotFoundException(`Subscriber ${id} not found`);
    }

    return this.prisma.subscriber.update({
      where: { id },
      data: {
        email: this.requiredEmail(payload.email, 'email'),
      },
    });
  }

  async deleteSubscriber(id: string) {
    const subscriber = await this.prisma.subscriber.findUnique({ where: { id } });
    if (!subscriber) {
      throw new NotFoundException(`Subscriber ${id} not found`);
    }

    await this.prisma.subscriber.delete({ where: { id } });
    return { success: true };
  }

  async uploadScreenshot(file?: { buffer?: Buffer }) {
    if (!file?.buffer) {
      throw new BadRequestException('file is required');
    }

    const output = await this.compressTo100Kb(file.buffer);
    const uploadsDir = join(process.cwd(), 'uploads', 'screenshots');
    await fs.mkdir(uploadsDir, { recursive: true });

    const filename = `${Date.now()}-${randomUUID()}.jpg`;
    const absolutePath = join(uploadsDir, filename);
    await fs.writeFile(absolutePath, output);

    return {
      url: `/uploads/screenshots/${filename}`,
      sizeBytes: output.byteLength,
    };
  }

  private async getAdminApp(id: string) {
    const app = await this.prisma.app.findUnique({
      where: { id },
      include: {
        pattern: true,
        teardown: true,
        assetBundle: true,
      },
    });

    if (!app) {
      throw new NotFoundException(`App ${id} not found`);
    }

    return app;
  }

  private isJoinRequestStatus(value: string): value is JoinRequestStatus {
    return Object.values(JoinRequestStatus).includes(value as JoinRequestStatus);
  }

  private guessPlatform(url: string) {
    const normalized = url.toLowerCase();
    if (normalized.includes('apps.apple.com')) return 'App Store';
    if (normalized.includes('play.google.com')) return 'Google Play';
    return 'Web';
  }

  private fallbackTitleFromUrl(url: string) {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, '');
      return host;
    } catch {
      return '未命名作品';
    }
  }

  private defaultFavicon(url: string) {
    try {
      const parsed = new URL(url);
      return `${parsed.origin}/favicon.ico`;
    } catch {
      return undefined;
    }
  }

  private extractMetaContent(html: string, names: string[]) {
    for (const name of names) {
      const pattern = new RegExp(
        `<meta[^>]+(?:property|name)=["']${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]+content=["']([^"']+)["'][^>]*>`,
        'i',
      );
      const matched = html.match(pattern);
      if (matched?.[1]) return this.normalizeText(matched[1]);
    }
    return undefined;
  }

  private extractTitleTag(html: string) {
    const matched = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (!matched?.[1]) return undefined;
    return this.normalizeText(matched[1]);
  }

  private extractIconUrl(html: string, baseUrl: string) {
    const iconRegex = /<link[^>]+rel=["'][^"']*(?:icon|apple-touch-icon)[^"']*["'][^>]*>/gi;
    const iconTag = html.match(iconRegex)?.[0];
    if (!iconTag) return undefined;
    const href = iconTag.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) return undefined;
    return this.toAbsoluteUrl(href, baseUrl);
  }

  private extractScreenshotCandidates(html: string, baseUrl: string) {
    const rawUrls: string[] = [];
    const ogImage = this.extractMetaContent(html, ['og:image', 'twitter:image']);
    if (ogImage) {
      rawUrls.push(ogImage);
    }

    const imageMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
    for (const match of imageMatches.slice(0, 30)) {
      if (match[1]) rawUrls.push(match[1]);
    }

    const normalized = rawUrls
      .map((item) => this.toAbsoluteUrl(item, baseUrl))
      .filter((item): item is string => Boolean(item))
      .filter((item) => /^https?:\/\//i.test(item))
      .filter((item) => !item.endsWith('.svg'));

    const unique = Array.from(new Set(normalized));
    return unique;
  }

  private toAbsoluteUrl(value: string, baseUrl: string) {
    const normalized = value.trim();
    if (!normalized) return undefined;
    if (/^https?:\/\//i.test(normalized)) return normalized;
    if (normalized.startsWith('//')) return `https:${normalized}`;
    try {
      return new URL(normalized, baseUrl).toString();
    } catch {
      return undefined;
    }
  }

  private normalizeText(value: string) {
    return value.replace(/\s+/g, ' ').trim();
  }

  private buildAppCreateData(payload: Record<string, unknown>): Prisma.AppCreateInput {
    const slug = this.requiredString(payload.slug, 'slug');
    const name = this.requiredString(payload.name, 'name');
    return {
      slug,
      name,
      tagline: this.optionalString(payload.tagline),
      saveTimeLabel: this.requiredString(payload.saveTimeLabel ?? '替用户省下关键时刻的 30 秒。', 'saveTimeLabel'),
      category: this.requiredString(payload.category ?? '效率', 'category'),
      pricing: this.normalizePricing(payload.pricing),
      channels: this.stringArray(payload.channels),
      targetPersona: this.requiredString(payload.targetPersona ?? '待补充目标用户', 'targetPersona'),
      hookAngle: this.requiredString(payload.hookAngle ?? '待补充产品钩子', 'hookAngle'),
      trustSignals: this.stringArray(payload.trustSignals),
      difficulty: this.nonNegativeInt(payload.difficulty ?? 1, 'difficulty'),
      heatScore: this.nonNegativeInt(payload.heatScore ?? 0, 'heatScore'),
      screenshotUrls: this.stringArray(payload.screenshotUrls),
      ...(this.optionalString(payload.patternId) ? { pattern: { connect: { id: this.optionalString(payload.patternId)! } } } : {}),
    };
  }

  private buildAppUpdateData(payload: Record<string, unknown>): Prisma.AppUpdateInput {
    const data: Prisma.AppUpdateInput = {};
    if (payload.slug !== undefined) data.slug = this.requiredString(payload.slug, 'slug');
    if (payload.name !== undefined) data.name = this.requiredString(payload.name, 'name');
    if (payload.tagline !== undefined) data.tagline = this.optionalString(payload.tagline);
    if (payload.saveTimeLabel !== undefined) data.saveTimeLabel = this.requiredString(payload.saveTimeLabel, 'saveTimeLabel');
    if (payload.category !== undefined) data.category = this.requiredString(payload.category, 'category');
    if (payload.pricing !== undefined) data.pricing = this.normalizePricing(payload.pricing);
    if (payload.channels !== undefined) data.channels = this.stringArray(payload.channels);
    if (payload.targetPersona !== undefined) data.targetPersona = this.requiredString(payload.targetPersona, 'targetPersona');
    if (payload.hookAngle !== undefined) data.hookAngle = this.requiredString(payload.hookAngle, 'hookAngle');
    if (payload.trustSignals !== undefined) data.trustSignals = this.stringArray(payload.trustSignals);
    if (payload.difficulty !== undefined) data.difficulty = this.nonNegativeInt(payload.difficulty, 'difficulty');
    if (payload.heatScore !== undefined) data.heatScore = this.nonNegativeInt(payload.heatScore, 'heatScore');
    if (payload.screenshotUrls !== undefined) data.screenshotUrls = this.stringArray(payload.screenshotUrls);
    if (payload.patternId !== undefined) {
      const patternId = this.optionalString(payload.patternId);
      data.pattern = patternId ? { connect: { id: patternId } } : { disconnect: true };
    }
    return data;
  }

  private async upsertNestedAppData(appId: string, payload: Record<string, unknown>) {
    const teardownPayload = this.objectRecord(payload.teardown);
    const assetPayload = this.objectRecord(payload.assetBundle);

    if (teardownPayload) {
      await this.prisma.teardown.upsert({
        where: { appId },
        update: this.buildTeardownData(teardownPayload),
        create: {
          appId,
          ...this.buildTeardownData(teardownPayload),
        },
      });
    }

    if (assetPayload) {
      await this.prisma.appAssetBundle.upsert({
        where: { appId },
        update: this.buildAssetBundleData(assetPayload),
        create: {
          appId,
          ...this.buildAssetBundleData(assetPayload),
        },
      });
    }
  }

  private buildTeardownData(payload: Record<string, unknown>) {
    return {
      painSummary: this.requiredString(payload.painSummary ?? '待补充编辑拆解', 'painSummary'),
      painScore: this.requiredString(payload.painScore ?? '待评估', 'painScore'),
      triggerScene: this.requiredString(payload.triggerScene ?? '待补充触发场景', 'triggerScene'),
      corePromise: this.requiredString(payload.corePromise ?? '待补充核心承诺', 'corePromise'),
      coreLoop: this.requiredString(payload.coreLoop ?? '待补充核心循环', 'coreLoop'),
      keyConstraints: this.stringArray(payload.keyConstraints),
      mvpScope: this.requiredString(payload.mvpScope ?? '待补充 MVP 范围', 'mvpScope'),
      dataInput: this.optionalString(payload.dataInput),
      dataOutput: this.optionalString(payload.dataOutput),
      faultTolerance: this.optionalString(payload.faultTolerance),
      coldStartStrategy: this.requiredString(payload.coldStartStrategy ?? '待补充冷启动策略', 'coldStartStrategy'),
      pricingLogic: this.requiredString(payload.pricingLogic ?? '待补充定价逻辑', 'pricingLogic'),
      competitorDelta: this.requiredString(payload.competitorDelta ?? '待补充差异化', 'competitorDelta'),
      riskNotes: this.requiredString(payload.riskNotes ?? '待补充风险项', 'riskNotes'),
      expansionSteps: this.stringArray(payload.expansionSteps),
      reverseIdeas: this.stringArray(payload.reverseIdeas),
    };
  }

  private buildAssetBundleData(payload: Record<string, unknown>) {
    return {
      hasAgentsTemplate: this.booleanValue(payload.hasAgentsTemplate),
      hasSpecTemplate: this.booleanValue(payload.hasSpecTemplate),
      hasPromptPack: this.booleanValue(payload.hasPromptPack),
      agentsTemplate: this.optionalString(payload.agentsTemplate),
      specTemplate: this.optionalString(payload.specTemplate),
      promptPack: this.optionalString(payload.promptPack),
    };
  }

  private defaultTeardownData() {
    return this.buildTeardownData({});
  }

  private defaultAssetBundleData() {
    return {
      ...this.buildAssetBundleData({
        hasAgentsTemplate: true,
        hasSpecTemplate: true,
        hasPromptPack: false,
        agentsTemplate: '# 自动草稿 AGENTS\n待人工补充协作协议。',
        specTemplate: '# 自动草稿 SPEC\n待人工补充接口、状态与异常流。',
      }),
    };
  }

  private normalizePricing(value: unknown): PricingModel {
    const fallback = PricingModel.FREEMIUM;
    if (typeof value !== 'string') return fallback;
    return Object.values(PricingModel).includes(value as PricingModel) ? (value as PricingModel) : fallback;
  }

  private requiredString(value: unknown, field: string) {
    const normalized = this.optionalString(value);
    if (!normalized) {
      throw new BadRequestException(`${field} is required`);
    }
    return normalized;
  }

  private optionalString(value: unknown) {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim();
    return normalized ? normalized : undefined;
  }

  private stringArray(value: unknown) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
      return value
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }

  private booleanValue(value: unknown) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value === 'true';
    return false;
  }

  private requiredEmail(value: unknown, field: string) {
    const email = this.requiredString(value, field).toLowerCase();
    if (!email.includes('@')) {
      throw new BadRequestException(`${field} must be a valid email`);
    }
    return email;
  }

  private nonNegativeInt(value: unknown, field: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new BadRequestException(`${field} must be a non-negative number`);
    }
    return Math.round(parsed);
  }

  private objectRecord(value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
  }

  private isSubmissionStatus(value: string): value is SubmissionStatus {
    return Object.values(SubmissionStatus).includes(value as SubmissionStatus);
  }

  private toSlug(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `submission-${Date.now()}`;
  }

  private async compressTo100Kb(input: Buffer) {
    const widths = [1440, 1080, 840];
    const qualities = [82, 72, 62, 52, 42, 35];
    let fallback = input;

    for (const width of widths) {
      for (const quality of qualities) {
        const candidate = await sharp(input)
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();

        fallback = candidate;
        if (candidate.byteLength <= 100 * 1024) {
          return candidate;
        }
      }
    }

    return fallback;
  }
}
