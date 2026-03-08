import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ContentStatus, CommentStatus } from '@prisma/client';

export class UpdateContentStatusDto {
  @IsEnum(ContentStatus)
  status!: ContentStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateCommentStatusDto {
  @IsEnum(CommentStatus)
  status!: CommentStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class BatchModerateDto {
  @IsString({ each: true })
  ids!: string[];

  @IsEnum(ContentStatus)
  status!: ContentStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateSimulatedCommentDto {
  @IsString()
  discussionId!: string;

  @IsString()
  authorId!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  replyToCommentId?: string;
}

export class UpdateAppContentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsString()
  saveTimeLabel?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  targetPersona?: string;

  @IsOptional()
  @IsString()
  hookAngle?: string;

  @IsOptional()
  heatScore?: number;

  @IsOptional()
  difficulty?: number;
}

export class UpdateDiscussionContentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  likesCount?: number;
}

export class CreateUserDto {
  @IsString()
  username!: string;

  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  persona?: string;
}
