export interface CreateIdeaDto {
  title: string;
  category: string;
  tags?: string[];
  note?: string;
  author?: string;
}
