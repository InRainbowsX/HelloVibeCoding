import { IsBoolean, IsOptional } from 'class-validator';

export class ToggleEngagementDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
