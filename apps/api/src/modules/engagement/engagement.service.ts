import { BadRequestException, Injectable } from '@nestjs/common';
import { EngagementTargetType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type ContentState = {
  likeCount: number;
  favoriteCount: number;
  viewerHasLiked: boolean;
  viewerHasFavorited: boolean;
};

@Injectable()
export class EngagementService {
  constructor(private readonly prisma: PrismaService) {}

  async mapStates(targetType: EngagementTargetType, targetIds: string[], userId?: string): Promise<Map<string, ContentState>> {
    const ids = Array.from(new Set(targetIds.filter(Boolean)));
    if (!ids.length) {
      return new Map();
    }

    const [likes, favorites, viewerLikes, viewerFavorites] = await Promise.all([
      this.prisma.contentLike.groupBy({
        by: ['targetId'],
        where: { targetType, targetId: { in: ids } },
        _count: { _all: true },
      }),
      this.prisma.contentFavorite.groupBy({
        by: ['targetId'],
        where: { targetType, targetId: { in: ids } },
        _count: { _all: true },
      }),
      userId?.trim()
        ? this.prisma.contentLike.findMany({
            where: { targetType, userId: userId.trim(), targetId: { in: ids } },
            select: { targetId: true },
          })
        : Promise.resolve([]),
      userId?.trim()
        ? this.prisma.contentFavorite.findMany({
            where: { targetType, userId: userId.trim(), targetId: { in: ids } },
            select: { targetId: true },
          })
        : Promise.resolve([]),
    ]);

    const likeMap = new Map(likes.map((item) => [item.targetId, item._count._all]));
    const favoriteMap = new Map(favorites.map((item) => [item.targetId, item._count._all]));
    const viewerLikedSet = new Set(viewerLikes.map((item) => item.targetId));
    const viewerFavoritedSet = new Set(viewerFavorites.map((item) => item.targetId));

    return new Map(
      ids.map((targetId) => [
        targetId,
        {
          likeCount: likeMap.get(targetId) || 0,
          favoriteCount: favoriteMap.get(targetId) || 0,
          viewerHasLiked: viewerLikedSet.has(targetId),
          viewerHasFavorited: viewerFavoritedSet.has(targetId),
        },
      ]),
    );
  }

  async toggleLike(targetType: EngagementTargetType, targetId: string, userId?: string, active?: boolean) {
    const viewerId = this.requireViewerId(userId);
    const where = {
      userId_targetType_targetId: {
        userId: viewerId,
        targetType,
        targetId,
      },
    };
    const existing = await this.prisma.contentLike.findUnique({ where });
    const shouldActivate = active ?? !existing;

    if (shouldActivate && !existing) {
      await this.prisma.contentLike.create({
        data: {
          userId: viewerId,
          targetType,
          targetId,
        },
      });
    }

    if (!shouldActivate && existing) {
      await this.prisma.contentLike.delete({ where });
    }

    return this.getState(targetType, targetId, viewerId);
  }

  async toggleFavorite(targetType: EngagementTargetType, targetId: string, userId?: string, active?: boolean) {
    const viewerId = this.requireViewerId(userId);
    const where = {
      userId_targetType_targetId: {
        userId: viewerId,
        targetType,
        targetId,
      },
    };
    const existing = await this.prisma.contentFavorite.findUnique({ where });
    const shouldActivate = active ?? !existing;

    if (shouldActivate && !existing) {
      await this.prisma.contentFavorite.create({
        data: {
          userId: viewerId,
          targetType,
          targetId,
        },
      });
    }

    if (!shouldActivate && existing) {
      await this.prisma.contentFavorite.delete({ where });
    }

    return this.getState(targetType, targetId, viewerId);
  }

  private requireViewerId(userId?: string) {
    const viewerId = userId?.trim();
    if (!viewerId) {
      throw new BadRequestException('userId is required');
    }
    return viewerId;
  }

  async getState(targetType: EngagementTargetType, targetId: string, userId?: string) {
    const state = await this.mapStates(targetType, [targetId], userId);
    return (
      state.get(targetId) || {
        likeCount: 0,
        favoriteCount: 0,
        viewerHasLiked: false,
        viewerHasFavorited: false,
      }
    );
  }
}
