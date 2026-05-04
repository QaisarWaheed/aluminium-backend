/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { Product } from 'src/features/products/entities/Product.entity';
import type { paymentMethodType } from './salesReturn.entity';
import { Customer } from '../customer/entities/customer.entity';

export class CreateSalesReturnDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  invoiceDate: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  paymentMethod: paymentMethodType;

  @ApiProperty()
  @IsArray()
  @IsObject({ each: true })
  @IsNotEmpty()
  products: Product[];

  @ApiProperty({ type: [Object], description: 'Array of customer objects' })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  customer: Customer[];

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  length: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  remarks: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  subTotal: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalGrossAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalDiscount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalNetAmount: number;

  // Accept frontend carry-over fields so whitelist validation doesn't reject them.
  @IsOptional()
  @IsDateString()
  quotationDate?: string;

  @IsOptional()
  @IsString()
  quotationNumber?: string;
}
