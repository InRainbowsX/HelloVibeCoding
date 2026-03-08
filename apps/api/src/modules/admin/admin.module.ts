import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminContentService } from './admin-content.service';
import { AdminUserService } from './admin-user.service';
import { AdminCommentSeedService } from './admin-comment-seed.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminContentService,
    AdminUserService,
    AdminCommentSeedService,
  ],
  exports: [
    AdminService,
    AdminContentService,
    AdminUserService,
    AdminCommentSeedService,
  ],
})
export class AdminModule {}
