export interface CreateCommentDto {
  authorName: string;
  content: string;
  replyToCommentId?: string;
}
