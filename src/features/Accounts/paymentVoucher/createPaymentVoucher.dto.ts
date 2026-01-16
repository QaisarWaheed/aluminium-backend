import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentVoucherDto {
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  voucherNumber: string;

  @ApiProperty({ required: true })
  @IsOptional()
  voucherDate: Date;

  @ApiProperty({ required: true })
  @IsString()
  @IsOptional()
  paidTo: string;

  @ApiProperty({ required: true })
  @IsNumber()
  @IsOptional()
  amount: number;

  @ApiProperty({ required: true })
  @IsString()
  @IsOptional()
  referenceNumber: string;

  @ApiProperty({ required: true })
  @IsString()
  @IsOptional()
  paymentMode: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}
