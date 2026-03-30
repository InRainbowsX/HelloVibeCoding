import { Body, Controller, Get, Headers, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ToggleEngagementDto } from '../engagement/dto/toggle-engagement.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOkResponse({ description: 'Paginated project directory list.' })
  findAll(@Query() query: ListProjectsQueryDto, @Headers('x-viewer-id') viewerId?: string) {
    return this.projectsService.findAll(query, viewerId);
  }

  @Get(':slug')
  @ApiOkResponse({ description: 'Project detail payload for overview, teardown, discussions, idea blocks, incubations, and rooms.' })
  findOne(@Param('slug') slug: string, @Headers('x-viewer-id') viewerId?: string) {
    return this.projectsService.findOne(slug, viewerId);
  }

  @Post(':slug/like')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: 'Like or unlike a project.' })
  toggleLike(
    @Param('slug') slug: string,
    @Body() dto: ToggleEngagementDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.projectsService.toggleLike(slug, req.user.userId, dto.active);
  }

  @Post(':slug/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: 'Favorite or unfavorite a project.' })
  toggleFavorite(
    @Param('slug') slug: string,
    @Body() dto: ToggleEngagementDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.projectsService.toggleFavorite(slug, req.user.userId, dto.active);
  }
}
