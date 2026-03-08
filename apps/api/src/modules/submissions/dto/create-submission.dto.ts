export interface CreateSubmissionDto {
  productName: string;
  websiteUrl: string;
  contactEmail: string;
  screenshotUrl?: string;
  selectedPattern?: string;
  notes?: string;
}
