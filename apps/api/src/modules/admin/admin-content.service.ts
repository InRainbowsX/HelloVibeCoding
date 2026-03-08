import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentStatus, CommentStatus, Prisma } from '@prisma/client';

@Injectable()
export class AdminContentService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== App Content Management ====================
  
  async updateAppContent(id: string, payload: Record<string, unknown>, adminId: string) {
    const app = await this.prisma.app.findUnique({ where: { id } });
    if (!app) {
      throw new NotFoundException(`App ${id} not found`);
    }

    const oldValue = JSON.stringify(app);
    
    const updated = await this.prisma.app.update({
      where: { id },
      data: {
        ...(payload.name !== undefined ? { name: String(payload.name) } : {}),
        ...(payload.tagline !== undefined ? { tagline: String(payload.tagline) || null } : {}),
        ...(payload.saveTimeLabel !== undefined ? { saveTimeLabel: String(payload.saveTimeLabel) } : {}),
        ...(payload.category !== undefined ? { category: String(payload.category) } : {}),
        ...(payload.targetPersona !== undefined ? { targetPersona: String(payload.targetPersona) } : {}),
        ...(payload.hookAngle !== undefined ? { hookAngle: String(payload.hookAngle) } : {}),
        ...(payload.heatScore !== undefined ? { heatScore: Math.max(0, Math.min(100, Number(payload.heatScore) || 0)) } : {}),
        ...(payload.difficulty !== undefined ? { difficulty: Math.max(1, Math.min(5, Number(payload.difficulty) || 1)) } : {}),
        ...(payload.contentStatus !== undefined ? { contentStatus: payload.contentStatus as ContentStatus } : {}),
      },
      include: {
        pattern: true,
        teardown: true,
        assetBundle: true,
      },
    });

    await this.createAuditLog({
      action: 'UPDATE_APP_CONTENT',
      entityType: 'App',
      entityId: id,
      oldValue,
      newValue: JSON.stringify(updated),
      adminId,
    });

    return updated;
  }

  async bulkUpdateAppStatus(ids: string[], status: ContentStatus, adminId: string, reason?: string) {
    const apps = await this.prisma.app.findMany({
      where: { id: { in: ids } },
    });

    if (apps.length !== ids.length) {
      throw new BadRequestException('Some apps not found');
    }

    const updated = await this.prisma.app.updateMany({
      where: { id: { in: ids } },
      data: { contentStatus: status },
    });

    for (const app of apps) {
      await this.createAuditLog({
        action: 'BULK_UPDATE_APP_STATUS',
        entityType: 'App',
        entityId: app.id,
        oldValue: JSON.stringify({ status: app.contentStatus }),
        newValue: JSON.stringify({ status }),
        reason,
        adminId,
      });
    }

    return { count: updated.count };
  }

  // ==================== Discussion Content Management ====================

  async updateDiscussionContent(id: string, payload: Record<string, unknown>, adminId: string) {
    const discussion = await this.prisma.discussion.findUnique({ 
      where: { id },
      include: { comments: true },
    });
    if (!discussion) {
      throw new NotFoundException(`Discussion ${id} not found`);
    }

    const oldValue = JSON.stringify(discussion);

    const updated = await this.prisma.discussion.update({
      where: { id },
      data: {
        ...(payload.title !== undefined ? { title: String(payload.title) } : {}),
        ...(payload.summary !== undefined ? { summary: String(payload.summary) || null } : {}),
        ...(payload.likesCount !== undefined ? { likesCount: Math.max(0, Number(payload.likesCount) || 0) } : {}),
        ...(payload.contentStatus !== undefined ? { contentStatus: payload.contentStatus as ContentStatus } : {}),
      },
      include: {
        comments: true,
        app: { select: { id: true, name: true, slug: true } },
        incubation: { select: { id: true, title: true, slug: true } },
      },
    });

    await this.createAuditLog({
      action: 'UPDATE_DISCUSSION_CONTENT',
      entityType: 'Discussion',
      entityId: id,
      oldValue,
      newValue: JSON.stringify(updated),
      adminId,
    });

    return updated;
  }

  // ==================== Comment Management ====================

  async listComments(filters: { status?: CommentStatus; isSimulated?: boolean; page?: number; pageSize?: number }) {
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.CommentWhereInput = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.isSimulated !== undefined ? { isSimulated: filters.isSimulated } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        include: {
          discussion: {
            select: { id: true, title: true, targetType: true },
          },
          author: {
            select: { id: true, username: true, displayName: true, isSimulated: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.comment.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async updateCommentStatus(id: string, status: CommentStatus, adminId: string, reason?: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`Comment ${id} not found`);
    }

    const oldValue = JSON.stringify({ status: comment.status });

    const updated = await this.prisma.comment.update({
      where: { id },
      data: { status },
    });

    await this.createAuditLog({
      action: 'UPDATE_COMMENT_STATUS',
      entityType: 'Comment',
      entityId: id,
      oldValue,
      newValue: JSON.stringify({ status }),
      reason,
      adminId,
    });

    return updated;
  }

  async bulkUpdateCommentStatus(ids: string[], status: CommentStatus, adminId: string, reason?: string) {
    const comments = await this.prisma.comment.findMany({
      where: { id: { in: ids } },
    });

    if (comments.length !== ids.length) {
      throw new BadRequestException('Some comments not found');
    }

    const updated = await this.prisma.comment.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });

    for (const comment of comments) {
      await this.createAuditLog({
        action: 'BULK_UPDATE_COMMENT_STATUS',
        entityType: 'Comment',
        entityId: comment.id,
        oldValue: JSON.stringify({ status: comment.status }),
        newValue: JSON.stringify({ status }),
        reason,
        adminId,
      });
    }

    return { count: updated.count };
  }

  async deleteComment(id: string, adminId: string, reason?: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`Comment ${id} not found`);
    }

    await this.createAuditLog({
      action: 'DELETE_COMMENT',
      entityType: 'Comment',
      entityId: id,
      oldValue: JSON.stringify(comment),
      reason,
      adminId,
    });

    await this.prisma.comment.delete({ where: { id } });
    return { success: true };
  }

  // ==================== Content Review Queue ====================

  async getContentReviewQueue() {
    const [pendingApps, pendingDiscussions, pendingComments] = await Promise.all([
      this.prisma.app.findMany({
        where: { contentStatus: ContentStatus.PENDING_REVIEW },
        orderBy: { createdAt: 'asc' },
        take: 50,
        include: {
          pattern: { select: { id: true, name: true } },
        },
      }),
      this.prisma.discussion.findMany({
        where: { contentStatus: ContentStatus.PENDING_REVIEW },
        orderBy: { createdAt: 'asc' },
        take: 50,
        include: {
          app: { select: { id: true, name: true, slug: true } },
          incubation: { select: { id: true, title: true, slug: true } },
        },
      }),
      this.prisma.comment.findMany({
        where: { status: CommentStatus.PENDING },
        orderBy: { createdAt: 'asc' },
        take: 50,
        include: {
          discussion: { select: { id: true, title: true } },
          author: { select: { id: true, username: true, displayName: true } },
        },
      }),
    ]);

    return {
      apps: pendingApps,
      discussions: pendingDiscussions,
      comments: pendingComments,
      totalCount: pendingApps.length + pendingDiscussions.length + pendingComments.length,
    };
  }

  // ==================== Statistics ====================

  async getContentStats() {
    const [
      appStats,
      discussionStats,
      commentStats,
      simulatedCommentCount,
    ] = await Promise.all([
      this.prisma.app.groupBy({
        by: ['contentStatus'],
        _count: { id: true },
      }),
      this.prisma.discussion.groupBy({
        by: ['contentStatus'],
        _count: { id: true },
      }),
      this.prisma.comment.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.comment.count({
        where: { isSimulated: true },
      }),
    ]);

    return {
      apps: appStats.reduce((acc, curr) => {
        acc[curr.contentStatus] = curr._count.id;
        return acc;
      }, {} as Record<string, number>),
      discussions: discussionStats.reduce((acc, curr) => {
        acc[curr.contentStatus] = curr._count.id;
        return acc;
      }, {} as Record<string, number>),
      comments: commentStats.reduce((acc, curr) => {
        acc[curr.status] = curr._count.id;
        return acc;
      }, {} as Record<string, number>),
      simulatedComments: simulatedCommentCount,
    };
  }

  // ==================== Audit Logs ====================

  async getAuditLogs(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        include: {
          admin: { select: { id: true, username: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.auditLog.count(),
    ]);

    return { items, total, page, pageSize };
  }

  private async createAuditLog(data: {
    action: string;
    entityType: string;
    entityId: string;
    oldValue?: string;
    newValue?: string;
    reason?: string;
    adminId: string;
  }) {
    await this.prisma.auditLog.create({
      data: {
        ...data,
        oldValue: data.oldValue?.slice(0, 10000),
        newValue: data.newValue?.slice(0, 10000),
      },
    });
  }
}
