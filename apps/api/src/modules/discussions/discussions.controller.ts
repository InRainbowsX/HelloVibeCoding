import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { DiscussionsService } from './discussions.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { ListDiscussionsQueryDto } from './dto/list-discussions-query.dto';

@ApiTags('discussions')
@Controller('discussions')
export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  @Get()
  @ApiOkResponse({ description: 'Discussion list with flat comments.' })
  findAll(@Query() query: ListDiscussionsQueryDto) {
    return this.discussionsService.findAll(query);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Discussion detail for a single thread.' })
  findOne(@Param('id') id: string) {
    return this.discussionsService.findOne(id);
  }

  @Post()
  @ApiOkResponse({ description: 'Create a new discussion thread with the opening comment.' })
  createDiscussion(@Body() dto: CreateDiscussionDto) {
    return this.discussionsService.createDiscussion(dto);
  }

  @Post(':id/comments')
  @ApiOkResponse({ description: 'Create a new flat comment or quoted reply.' })
  createComment(@Param('id') id: string, @Body() dto: CreateCommentDto) {
    return this.discussionsService.createComment(id, dto);
  }

  @Post(':id/like')
  @ApiOkResponse({ description: 'Increment a discussion like count.' })
  likeDiscussion(@Param('id') id: string) {
    return this.discussionsService.likeDiscussion(id);
  }
}
