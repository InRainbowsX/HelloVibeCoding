import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AppsService } from './apps.service';
import { ListAppsQueryDto } from './dto/list-apps-query.dto';

@ApiTags('apps')
@Controller('apps')
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  @Get()
  @ApiOkResponse({ description: 'Paginated product directory list.' })
  findAll(@Query() query: ListAppsQueryDto) {
    return this.appsService.findAll(query);
  }

  @Get(':slug')
  @ApiOkResponse({ description: 'Detailed product intelligence.' })
  findOne(@Param('slug') slug: string) {
    return this.appsService.findOne(slug);
  }
}
