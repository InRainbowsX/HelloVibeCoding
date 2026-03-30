import { Body, Controller, Get, Headers, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ToggleEngagementDto } from '../engagement/dto/toggle-engagement.dto';
import { IdeaBlocksService } from './idea-blocks.service';
import { RecommendIdeaProductsDto } from './dto/recommend-idea-products.dto';

@ApiTags('idea-blocks')
@Controller('idea-blocks')
export class IdeaBlocksController {
  constructor(private readonly ideaBlocksService: IdeaBlocksService) {}

  @Get()
  @ApiOkResponse({ description: 'Paginated reusable idea block list.' })
  findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Headers('x-viewer-id') viewerId?: string) {
    return this.ideaBlocksService.findAll(page, pageSize, viewerId);
  }

  @Get(':slug')
  @ApiOkResponse({ description: 'Idea block detail.' })
  findOne(@Param('slug') slug: string, @Headers('x-viewer-id') viewerId?: string) {
    return this.ideaBlocksService.findOne(slug, viewerId);
  }

  @Post('recommendations')
  @ApiOkResponse({ description: 'Generate 3 product recommendations from selected idea blocks.' })
  recommendProducts(@Body() dto: RecommendIdeaProductsDto) {
    return this.ideaBlocksService.recommendProducts(dto);
  }

  @Post(':slug/like')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: 'Like or unlike an idea block.' })
  toggleLike(
    @Param('slug') slug: string,
    @Body() dto: ToggleEngagementDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.ideaBlocksService.toggleLike(slug, req.user.userId, dto.active);
  }

  @Post(':slug/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: 'Favorite or unfavorite an idea block.' })
  toggleFavorite(
    @Param('slug') slug: string,
    @Body() dto: ToggleEngagementDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.ideaBlocksService.toggleFavorite(slug, req.user.userId, dto.active);
  }
}
