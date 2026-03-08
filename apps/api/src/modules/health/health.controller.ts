import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ description: 'Simple health probe.' })
  getHealth() {
    return {
      status: 'ok',
      service: 'helloVibeCoding-api',
      timestamp: new Date().toISOString(),
    };
  }
}
