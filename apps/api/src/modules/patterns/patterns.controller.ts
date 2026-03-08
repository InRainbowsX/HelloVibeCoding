import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PatternsService } from './patterns.service';

@ApiTags('patterns')
@Controller('patterns')
export class PatternsController {
  constructor(private readonly patternsService: PatternsService) {}

  @Get()
  @ApiOkResponse({ description: 'List patterns for filters and browsing.' })
  findAll() {
    return this.patternsService.findAll();
  }

  @Get(':slug')
  @ApiOkResponse({ description: 'Pattern detail and related products.' })
  findOne(@Param('slug') slug: string) {
    return this.patternsService.findOne(slug);
  }
}
