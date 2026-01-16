import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { paymentMethodType } from 'src/features/sales/salesInvoice/salesinvoice.entity';

export class CreateRecipetVoucherDto {
  @IsNotEmpty()
  @IsString()
  voucherNumber: string;

  @ApiProperty()
  @IsOptional()
  voucherDate: Date;

  @ApiProperty()
  @IsString()
  @IsOptional()
  receivedFrom: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  amount: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  referenceNumber: string;

  @ApiProperty()
  @IsOptional()
  paymentMode: paymentMethodType;

  @ApiProperty()
  @IsString()
  @IsOptional()
  remarks?: string;
}
