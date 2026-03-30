import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminModule } from './admin/admin.module';
import { AppsModule } from './apps/apps.module';
import { AuthModule } from './auth/auth.module';
import { DigestModule } from './digest/digest.module';
import { DiscussionsModule } from './discussions/discussions.module';
import { EngagementModule } from './engagement/engagement.module';
import { HealthModule } from './health/health.module';
import { IdeaBlocksModule } from './idea-blocks/idea-blocks.module';
import { IdeasModule } from './ideas/ideas.module';
import { IncubationsModule } from './incubations/incubations.module';
import { PatternsModule } from './patterns/patterns.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { RoomsModule } from './rooms/rooms.module';
import { SubmissionsModule } from './submissions/submissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    EngagementModule,
    HealthModule,
    AuthModule,
    IdeasModule,
    AppsModule,
    ProjectsModule,
    PatternsModule,
    DiscussionsModule,
    IdeaBlocksModule,
    IncubationsModule,
    RoomsModule,
    SubmissionsModule,
    AdminModule,
    DigestModule,
  ],
})
export class AppModule {}
