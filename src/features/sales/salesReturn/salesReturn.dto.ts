/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Product } from 'src/features/products/entities/Product.entity';
import type { paymentMethodType } from './salesReturn.entity';
import { Customer } from '../customer/entities/customer.entity';

export class CreateSalesReturnDto {
  @ApiProperty()
  @IsString()
  invoiceNumber: string;

  @ApiProperty()
  @IsDateString()
  invoiceDate: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  paymentMethod: paymentMethodType;

  @ApiProperty()
  @IsArray()
  @IsObject({ each: true })
  products: Product[];

  @ApiProperty({ type: [Object], description: 'Array of customer objects' })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  customer: Customer[];

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  discount: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  length: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  remarks: string;

  @IsOptional()
  @IsNumber()
  subTotal: number;

  @IsOptional()
  @IsNumber()
  totalGrossAmount: number;

  @IsOptional()
  @IsNumber()
  totalDiscount: number;

  @IsOptional()
  @IsNumber()
  totalNetAmount: number;

  // Accept frontend carry-over fields so whitelist validation doesn't reject them.
  @IsOptional()
  @IsDateString()
  quotationDate?: string;

  @IsOptional()
  @IsString()
  quotationNumber?: string;
}
