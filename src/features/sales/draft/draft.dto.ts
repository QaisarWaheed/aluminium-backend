import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import type { DraftData } from '../interfaces/draft-data.interface';

export class CreateDraftDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsOptional()
  data: DraftData;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  title?: string;
}

export class UpdateDraftDto {
  @IsOptional()
  data?: DraftData;

  @IsString()
  @IsOptional()
  title?: string;
}
