import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOkResponse({ description: 'Paginated project directory list.' })
  findAll(@Query() query: ListProjectsQueryDto) {
    return this.projectsService.findAll(query);
  }

  @Get(':slug')
  @ApiOkResponse({ description: 'Project detail payload for overview, teardown, discussions, idea blocks, incubations, and rooms.' })
  findOne(@Param('slug') slug: string) {
    return this.projectsService.findOne(slug);
  }
}
