export interface ReviewSubmissionDto {
  status: 'APPROVED' | 'REJECTED';
  slug?: string;
}
