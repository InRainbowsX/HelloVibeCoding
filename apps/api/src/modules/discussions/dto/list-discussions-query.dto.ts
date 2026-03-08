export interface ListDiscussionsQueryDto {
  targetType?: 'APP' | 'PROJECT' | 'PATTERN' | 'INCUBATION';
  targetId?: string;
  sort?: 'latest' | 'top';
  page?: string;
  pageSize?: string;
}
