export interface CreateIncubationDto {
  slug: string;
  title: string;
  oneLiner: string;
  createdBy: string;
  blockSlugs: string[];
  sourceProjectSlugs: string[];
}
