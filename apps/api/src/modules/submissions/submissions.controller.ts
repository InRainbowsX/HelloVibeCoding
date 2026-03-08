import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { SubscribeDto } from './dto/subscribe.dto';
import { SubmissionsService } from './submissions.service';

@ApiTags('submissions')
@Controller()
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post('submissions')
  @ApiOkResponse({ description: 'Create a new product submission.' })
  createSubmission(@Body() dto: CreateSubmissionDto) {
    return this.submissionsService.createSubmission(dto);
  }

  @Post('subscribe')
  @ApiOkResponse({ description: 'Subscribe to weekly digest.' })
  subscribe(@Body() dto: SubscribeDto) {
    return this.submissionsService.subscribe(dto);
  }
}
