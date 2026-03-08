import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateIncubationDto } from './dto/create-incubation.dto';
import { IncubationsService } from './incubations.service';

@ApiTags('incubations')
@Controller('incubations')
export class IncubationsController {
  constructor(private readonly incubationsService: IncubationsService) {}

  @Get()
  @ApiOkResponse({ description: 'Paginated idea incubation list.' })
  findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.incubationsService.findAll(page, pageSize);
  }

  @Get(':slug')
  @ApiOkResponse({ description: 'Idea incubation detail.' })
  findOne(@Param('slug') slug: string) {
    return this.incubationsService.findOne(slug);
  }

  @Post()
  @ApiOkResponse({ description: 'Create a new idea incubation from idea blocks and source projects.' })
  create(@Body() dto: CreateIncubationDto) {
    return this.incubationsService.create(dto);
  }
}
