import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminContentService } from './admin-content.service';
import { AdminUserService } from './admin-user.service';
import { AdminCommentSeedService } from './admin-comment-seed.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AdminTokenGuard } from './admin-token.guard';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminContentService,
    AdminUserService,
    AdminCommentSeedService,
    AdminTokenGuard,
  ],
  exports: [
    AdminService,
    AdminContentService,
    AdminUserService,
    AdminCommentSeedService,
  ],
})
export class AdminModule {}
