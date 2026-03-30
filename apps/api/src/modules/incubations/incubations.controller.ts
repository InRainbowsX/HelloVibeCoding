import { Body, Controller, Get, Headers, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ToggleEngagementDto } from '../engagement/dto/toggle-engagement.dto';
import { CreateIncubationDto } from './dto/create-incubation.dto';
import { IncubationsService } from './incubations.service';

@ApiTags('incubations')
@Controller('incubations')
export class IncubationsController {
  constructor(private readonly incubationsService: IncubationsService) {}

  @Get()
  @ApiOkResponse({ description: 'Paginated idea incubation list.' })
  findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Headers('x-viewer-id') viewerId?: string) {
    return this.incubationsService.findAll(page, pageSize, viewerId);
  }

  @Get(':slug')
  @ApiOkResponse({ description: 'Idea incubation detail.' })
  findOne(@Param('slug') slug: string, @Headers('x-viewer-id') viewerId?: string) {
    return this.incubationsService.findOne(slug, viewerId);
  }

  @Post()
  @ApiOkResponse({ description: 'Create a new idea incubation from idea blocks and source projects.' })
  create(@Body() dto: CreateIncubationDto) {
    return this.incubationsService.create(dto);
  }

  @Post(':slug/like')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: 'Like or unlike an incubation.' })
  toggleLike(
    @Param('slug') slug: string,
    @Body() dto: ToggleEngagementDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.incubationsService.toggleLike(slug, req.user.userId, dto.active);
  }

  @Post(':slug/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: 'Favorite or unfavorite an incubation.' })
  toggleFavorite(
    @Param('slug') slug: string,
    @Body() dto: ToggleEngagementDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.incubationsService.toggleFavorite(slug, req.user.userId, dto.active);
  }
}
