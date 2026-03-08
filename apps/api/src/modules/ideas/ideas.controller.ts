import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminTokenGuard } from '../admin/admin-token.guard';
import { IdeasService } from './ideas.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { CreateIdeaEvidenceDto } from './dto/create-idea-evidence.dto';
import { CreateIdeaMessageDto } from './dto/create-idea-message.dto';
import { CreateJoinRequestDto } from './dto/create-join-request.dto';
import { ListIdeasQueryDto } from './dto/list-ideas-query.dto';

@ApiTags('ideas')
@Controller('ideas')
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Get()
  @ApiOkResponse({ description: 'Paginated idea list for the v2 idea-first frontend.' })
  findAll(@Query() query: ListIdeasQueryDto) {
    return this.ideasService.findAll(query);
  }

  @Post()
  @ApiOkResponse({ description: 'Create a new idea.' })
  create(@Body() dto: CreateIdeaDto) {
    return this.ideasService.create(dto);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Idea detail including evidence and room messages.' })
  findOne(@Param('id') id: string, @Query('user_id') userId?: string) {
    return this.ideasService.findOne(id, userId);
  }

  @Get(':id/apps')
  @ApiOkResponse({ description: 'List evidence cards for an idea.' })
  listEvidence(@Param('id') id: string) {
    return this.ideasService.listEvidence(id);
  }

  @Get(':id/apps/:appId/detail')
  @ApiOkResponse({ description: 'Fetch evidence detail with scraped app metadata.' })
  getEvidenceDetail(@Param('id') id: string, @Param('appId') appId: string) {
    return this.ideasService.getEvidenceDetail(id, appId);
  }

  @Post(':id/apps')
  @UseGuards(AdminTokenGuard)
  @ApiOkResponse({ description: 'Create an evidence card for an idea.' })
  createEvidence(@Param('id') id: string, @Body() dto: CreateIdeaEvidenceDto) {
    return this.ideasService.createEvidence(id, dto);
  }

  @Delete(':id/apps/:appId')
  @UseGuards(AdminTokenGuard)
  @ApiOkResponse({ description: 'Delete an evidence card from an idea.' })
  deleteEvidence(@Param('id') id: string, @Param('appId') appId: string) {
    return this.ideasService.deleteEvidence(id, appId);
  }

  @Post(':id/join-request')
  @ApiOkResponse({ description: 'Submit a gated join request.' })
  createJoinRequest(@Param('id') id: string, @Body() dto: CreateJoinRequestDto) {
    return this.ideasService.createJoinRequest(id, dto);
  }

  @Get(':id/join-status')
  @ApiOkResponse({ description: 'Return join status for a given user.' })
  getJoinStatus(@Param('id') id: string, @Query('user_id') userId?: string) {
    return this.ideasService.getJoinStatus(id, userId);
  }

  @Get(':id/messages')
  @ApiOkResponse({ description: 'List room messages for polling.' })
  listMessages(@Param('id') id: string) {
    return this.ideasService.listMessages(id);
  }

  @Post(':id/messages')
  @ApiOkResponse({ description: 'Create a gated room message for approved members.' })
  createMessage(@Param('id') id: string, @Body() dto: CreateIdeaMessageDto) {
    return this.ideasService.createMessage(id, dto);
  }
}
