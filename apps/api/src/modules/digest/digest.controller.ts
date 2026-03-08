import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { DigestService } from './digest.service';

@ApiTags('digest')
@Controller('digest')
export class DigestController {
  constructor(private readonly digestService: DigestService) {}

  @Get()
  @ApiOkResponse({ description: 'Recent digest issues.' })
  listIssues() {
    return this.digestService.listIssues();
  }
}
