import { IsNumber, Min } from 'class-validator';

export class OpenSessionDto {
  @IsNumber()
  @Min(0)
  openingBalance: number;
}
