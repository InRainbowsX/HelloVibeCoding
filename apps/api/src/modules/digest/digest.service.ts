import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DigestService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 0 9 * * 1')
  async generateWeeklyDigest() {
    const topApps = await this.prisma.app.findMany({
      orderBy: [{ heatScore: 'desc' }, { createdAt: 'desc' }],
      take: 5,
    });

    if (topApps.length === 0) {
      return null;
    }

    const issueDate = new Date();
    const title = `Weekly Digest ${issueDate.toISOString().slice(0, 10)}`;
    const contentMarkdown = topApps
      .map((app, index) => `${index + 1}. ${app.name} - ${app.tagline || 'No tagline yet'}`)
      .join('\n');

    return this.prisma.digestIssue.create({
      data: {
        issueDate,
        title,
        contentMarkdown,
      },
    });
  }

  async listIssues() {
    return this.prisma.digestIssue.findMany({
      orderBy: { issueDate: 'desc' },
      take: 12,
    });
  }
}
