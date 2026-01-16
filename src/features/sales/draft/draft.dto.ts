import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDraftDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsOptional()
  data: any;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  title?: string;
}

export class UpdateDraftDto {
  @IsOptional()
  data?: any;

  @IsString()
  @IsOptional()
  title?: string;
}
