import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EngagementService } from './engagement.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [EngagementService],
  exports: [EngagementService],
})
export class EngagementModule {}
