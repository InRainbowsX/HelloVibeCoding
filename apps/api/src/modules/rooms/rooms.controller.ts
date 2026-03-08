import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateRoomMessageDto } from './dto/create-room-message.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomsService } from './rooms.service';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @ApiOkResponse({ description: 'Rooms linked to projects or incubations.' })
  findAll() {
    return this.roomsService.findAll();
  }

  @Get(':slug')
  @ApiOkResponse({ description: 'Room detail with message flow.' })
  findOne(@Param('slug') slug: string) {
    return this.roomsService.findOne(slug);
  }

  @Post()
  @ApiOkResponse({ description: 'Create a room linked to a project or incubation.' })
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @Post(':slug/messages')
  @ApiOkResponse({ description: 'Append a room message.' })
  createMessage(@Param('slug') slug: string, @Body() dto: CreateRoomMessageDto) {
    return this.roomsService.createMessage(slug, dto);
  }
}
