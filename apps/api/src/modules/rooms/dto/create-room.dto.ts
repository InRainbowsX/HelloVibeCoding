export interface CreateRoomDto {
  slug: string;
  name: string;
  goal: string;
  targetType: 'PROJECT' | 'INCUBATION';
  targetId: string;
  createdBy: string;
}
