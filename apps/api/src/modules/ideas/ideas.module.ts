import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminTokenGuard } from '../admin/admin-token.guard';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [IdeasController],
  providers: [IdeasService, AdminTokenGuard],
  exports: [IdeasService],
})
export class IdeasModule {}
