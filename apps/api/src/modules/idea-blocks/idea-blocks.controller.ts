import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IdeaBlocksService } from './idea-blocks.service';
import { RecommendIdeaProductsDto } from './dto/recommend-idea-products.dto';

@ApiTags('idea-blocks')
@Controller('idea-blocks')
export class IdeaBlocksController {
  constructor(private readonly ideaBlocksService: IdeaBlocksService) {}

  @Get()
  @ApiOkResponse({ description: 'Paginated reusable idea block list.' })
  findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.ideaBlocksService.findAll(page, pageSize);
  }

  @Get(':slug')
  @ApiOkResponse({ description: 'Idea block detail.' })
  findOne(@Param('slug') slug: string) {
    return this.ideaBlocksService.findOne(slug);
  }

  @Post('recommendations')
  @ApiOkResponse({ description: 'Generate 3 product recommendations from selected idea blocks.' })
  recommendProducts(@Body() dto: RecommendIdeaProductsDto) {
    return this.ideaBlocksService.recommendProducts(dto);
  }
}
