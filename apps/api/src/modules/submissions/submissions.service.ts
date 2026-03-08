import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSubmission(dto: CreateSubmissionDto) {
    if (!dto.productName?.trim() || !dto.websiteUrl?.trim() || !dto.contactEmail?.trim()) {
      throw new BadRequestException('productName, websiteUrl and contactEmail are required');
    }

    return this.prisma.submission.create({
      data: {
        productName: dto.productName.trim(),
        websiteUrl: dto.websiteUrl.trim(),
        contactEmail: dto.contactEmail.trim().toLowerCase(),
        screenshotUrl: dto.screenshotUrl?.trim(),
        selectedPattern: dto.selectedPattern?.trim(),
        notes: dto.notes?.trim(),
      },
    });
  }

  async subscribe(dto: SubscribeDto) {
    const email = dto.email?.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      throw new BadRequestException('A valid email is required');
    }

    const subscriber = await this.prisma.subscriber.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    return {
      success: true,
      subscriber,
    };
  }
}
