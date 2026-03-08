import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IdeaBlocksController } from './idea-blocks.controller';
import { IdeaBlocksService } from './idea-blocks.service';

@Module({
  imports: [PrismaModule],
  controllers: [IdeaBlocksController],
  providers: [IdeaBlocksService],
})
export class IdeaBlocksModule {}
