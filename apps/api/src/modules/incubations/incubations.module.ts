import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { IncubationsController } from './incubations.controller';
import { IncubationsService } from './incubations.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [IncubationsController],
  providers: [IncubationsService],
})
export class IncubationsModule {}
