import { Body, Controller, Delete, Get, Param, Patch, Post, Query, SetMetadata, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { AdminContentService } from './admin-content.service';
import { AdminUserService } from './admin-user.service';
import { AdminCommentSeedService } from './admin-comment-seed.service';
import { AdminTokenGuard, SKIP_ADMIN_TOKEN_AUTH } from './admin-token.guard';
import { ReviewSubmissionDto } from './dto/review-submission.dto';
import { 
  UpdateContentStatusDto, 
  UpdateCommentStatusDto, 
  BatchModerateDto,
  CreateSimulatedCommentDto,
  UpdateAppContentDto,
  UpdateDiscussionContentDto,
  CreateUserDto,
} from './dto/content-moderation.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(AdminTokenGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly contentService: AdminContentService,
    private readonly userService: AdminUserService,
    private readonly commentSeedService: AdminCommentSeedService,
  ) {}

  // ==================== Submissions ====================

  @Get('submissions')
  @ApiOkResponse({ description: 'List submissions for moderation.' })
  listSubmissions(@Query('status') status?: string) {
    return this.adminService.listSubmissions(status);
  }

  @Post('submissions/:id/review')
  @ApiOkResponse({ description: 'Review and optionally publish a submission.' })
  reviewSubmission(@Param('id') id: string, @Body() dto: ReviewSubmissionDto) {
    return this.adminService.reviewSubmission(id, dto);
  }

  @Delete('submissions/:id')
  @ApiOkResponse({ description: 'Delete a submission.' })
  deleteSubmission(@Param('id') id: string) {
    return this.adminService.deleteSubmission(id);
  }

  // ==================== Join Requests ====================

  @Get('join-requests')
  @ApiOkResponse({ description: 'List join requests for moderation.' })
  listJoinRequests(@Query('status') status?: string) {
    return this.adminService.listJoinRequests(status);
  }

  @Post('join-requests/:id/approve')
  @ApiOkResponse({ description: 'Approve a join request and create membership.' })
  approveJoinRequest(@Param('id') id: string) {
    return this.adminService.approveJoinRequest(id);
  }

  @Post('join-requests/:id/reject')
  @ApiOkResponse({ description: 'Reject a join request.' })
  rejectJoinRequest(@Param('id') id: string) {
    return this.adminService.rejectJoinRequest(id);
  }

  // ==================== Ideas ====================

  @Patch('ideas/:id')
  @ApiOkResponse({ description: 'Update idea featured / novel metadata.' })
  updateIdea(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    return this.adminService.updateIdea(id, payload);
  }

  @Post('evidence/fetch')
  @ApiOkResponse({ description: 'Fetch evidence draft metadata from a URL.' })
  fetchEvidenceDraft(@Body() payload: Record<string, unknown>) {
    return this.adminService.fetchEvidenceDraft(payload);
  }

  // ==================== Apps (Enhanced) ====================

  @Get('apps')
  @ApiOkResponse({ description: 'List apps for admin CRUD.' })
  listApps(@Query('status') status?: string) {
    return this.adminService.listApps();
  }

  @Post('apps')
  @ApiOkResponse({ description: 'Create an app draft with nested teardown and asset bundle.' })
  createApp(@Body() payload: Record<string, unknown>) {
    return this.adminService.createApp(payload);
  }

  @Patch('apps/:id')
  @ApiOkResponse({ description: 'Update an app draft with nested teardown and asset bundle.' })
  updateApp(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    return this.adminService.updateApp(id, payload);
  }

  @Patch('apps/:id/content')
  @ApiOkResponse({ description: 'Update app content fields (name, tagline, etc).' })
  updateAppContent(
    @Param('id') id: string, 
    @Body() dto: UpdateAppContentDto,
    @Query('adminId') adminId?: string,
  ) {
    return this.contentService.updateAppContent(id, dto as Record<string, unknown>, adminId || 'system');
  }

  @Post('apps/bulk-status')
  @ApiOkResponse({ description: 'Bulk update app content status.' })
  bulkUpdateAppStatus(
    @Body() dto: BatchModerateDto,
    @Query('adminId') adminId?: string,
  ) {
    return this.contentService.bulkUpdateAppStatus(dto.ids, dto.status, adminId || 'system', dto.reason);
  }

  @Delete('apps/:id')
  @ApiOkResponse({ description: 'Delete an app draft.' })
  deleteApp(@Param('id') id: string) {
    return this.adminService.deleteApp(id);
  }

  // ==================== Patterns ====================

  @Get('patterns')
  @ApiOkResponse({ description: 'List patterns for admin CRUD.' })
  listPatterns() {
    return this.adminService.listPatterns();
  }

  @Post('patterns')
  @ApiOkResponse({ description: 'Create a pattern.' })
  createPattern(@Body() payload: Record<string, unknown>) {
    return this.adminService.createPattern(payload);
  }

  @Patch('patterns/:id')
  @ApiOkResponse({ description: 'Update a pattern.' })
  updatePattern(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    return this.adminService.updatePattern(id, payload);
  }

  @Delete('patterns/:id')
  @ApiOkResponse({ description: 'Delete a pattern.' })
  deletePattern(@Param('id') id: string) {
    return this.adminService.deletePattern(id);
  }

  // ==================== Discussions (Enhanced) ====================

  @Get('discussions')
  @ApiOkResponse({ description: 'List discussions for admin CRUD.' })
  listDiscussions() {
    return this.adminService.listDiscussions();
  }

  @Patch('discussions/:id')
  @ApiOkResponse({ description: 'Update a discussion title.' })
  updateDiscussion(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    return this.adminService.updateDiscussion(id, payload);
  }

  @Patch('discussions/:id/content')
  @ApiOkResponse({ description: 'Update discussion content fields.' })
  updateDiscussionContent(
    @Param('id') id: string, 
    @Body() dto: UpdateDiscussionContentDto,
    @Query('adminId') adminId?: string,
  ) {
    return this.contentService.updateDiscussionContent(id, dto as Record<string, unknown>, adminId || 'system');
  }

  @Delete('discussions/:id')
  @ApiOkResponse({ description: 'Delete a discussion thread and comments.' })
  deleteDiscussion(@Param('id') id: string) {
    return this.adminService.deleteDiscussion(id);
  }

  // ==================== Comments (New) ====================

  @Get('comments')
  @ApiOkResponse({ description: 'List comments with filters.' })
  listComments(
    @Query('status') status?: string,
    @Query('isSimulated') isSimulated?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.contentService.listComments({
      status: status as any,
      isSimulated: isSimulated !== undefined ? isSimulated === 'true' : undefined,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Patch('comments/:id/status')
  @ApiOkResponse({ description: 'Update comment status.' })
  updateCommentStatus(
    @Param('id') id: string, 
    @Body() dto: UpdateCommentStatusDto,
    @Query('adminId') adminId?: string,
  ) {
    return this.contentService.updateCommentStatus(id, dto.status, adminId || 'system', dto.reason);
  }

  @Post('comments/bulk-status')
  @ApiOkResponse({ description: 'Bulk update comment status.' })
  bulkUpdateCommentStatus(
    @Body() dto: BatchModerateDto,
    @Query('adminId') adminId?: string,
  ) {
    return this.contentService.bulkUpdateCommentStatus(dto.ids, dto.status as any, adminId || 'system', dto.reason);
  }

  @Delete('comments/:id')
  @ApiOkResponse({ description: 'Delete a comment.' })
  deleteComment(
    @Param('id') id: string,
    @Query('adminId') adminId?: string,
    @Body('reason') reason?: string,
  ) {
    return this.contentService.deleteComment(id, adminId || 'system', reason);
  }

  // ==================== Users (New) ====================

  @Get('users')
  @ApiOkResponse({ description: 'List users.' })
  listUsers(
    @Query('isSimulated') isSimulated?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    return this.userService.listUsers({
      isSimulated: isSimulated !== undefined ? isSimulated === 'true' : undefined,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      search,
    });
  }

  @Get('users/:id')
  @ApiOkResponse({ description: 'Get user details.' })
  getUser(@Param('id') id: string) {
    return this.userService.getUser(id);
  }

  @Post('users')
  @ApiOkResponse({ description: 'Create a user.' })
  createUser(@Body() dto: CreateUserDto) {
    return this.userService.createUser({
      ...dto,
      isSimulated: false,
    });
  }

  @Patch('users/:id')
  @ApiOkResponse({ description: 'Update a user.' })
  updateUser(@Param('id') id: string, @Body() dto: Partial<CreateUserDto>) {
    return this.userService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @ApiOkResponse({ description: 'Delete a user.' })
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  // ==================== Simulated Data (New) ====================

  @Post('simulated/users')
  @ApiOkResponse({ description: 'Generate simulated users.' })
  createSimulatedUsers(@Body('count') count?: number) {
    return this.userService.createSimulatedUsers(count || 10);
  }

  @Post('simulated/comments')
  @ApiOkResponse({ description: 'Generate simulated comments.' })
  generateSimulatedComments(@Body() dto: { 
    discussionIds?: string[]; 
    countPerDiscussion?: number;
    userIds?: string[];
  }) {
    return this.commentSeedService.generateSimulatedComments(dto);
  }

  @Delete('simulated/comments')
  @ApiOkResponse({ description: 'Clear all simulated comments.' })
  clearSimulatedComments() {
    return this.commentSeedService.clearSimulatedComments();
  }

  // ==================== Content Review Queue (New) ====================

  @Get('review-queue')
  @ApiOkResponse({ description: 'Get content review queue.' })
  getContentReviewQueue() {
    return this.contentService.getContentReviewQueue();
  }

  @Get('content-stats')
  @ApiOkResponse({ description: 'Get content statistics.' })
  getContentStats() {
    return this.contentService.getContentStats();
  }

  @Get('audit-logs')
  @ApiOkResponse({ description: 'Get audit logs.' })
  getAuditLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.contentService.getAuditLogs(
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  // ==================== Subscribers ====================

  @Get('subscribers')
  @ApiOkResponse({ description: 'List subscribers for admin CRUD.' })
  listSubscribers() {
    return this.adminService.listSubscribers();
  }

  @Post('subscribers')
  @ApiOkResponse({ description: 'Create a subscriber.' })
  createSubscriber(@Body() payload: Record<string, unknown>) {
    return this.adminService.createSubscriber(payload);
  }

  @Patch('subscribers/:id')
  @ApiOkResponse({ description: 'Update a subscriber email.' })
  updateSubscriber(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    return this.adminService.updateSubscriber(id, payload);
  }

  @Delete('subscribers/:id')
  @ApiOkResponse({ description: 'Delete a subscriber.' })
  deleteSubscriber(@Param('id') id: string) {
    return this.adminService.deleteSubscriber(id);
  }

  // ==================== Uploads ====================

  @Post('uploads/screenshot')
  @SetMetadata(SKIP_ADMIN_TOKEN_AUTH, true)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOkResponse({ description: 'Upload and compress a screenshot to <= 100KB.' })
  uploadScreenshot(@UploadedFile() file: { buffer?: Buffer } | undefined) {
    return this.adminService.uploadScreenshot(file);
  }
}
