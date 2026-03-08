export interface CreateDiscussionDto {
  title: string;
  targetType: 'APP' | 'PROJECT' | 'PATTERN' | 'INCUBATION';
  targetId: string;
  authorName: string;
  content: string;
}
