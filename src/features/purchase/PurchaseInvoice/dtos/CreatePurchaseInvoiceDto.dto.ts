/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { Supplier } from '../../supplier/supplier.entity';
import { Product } from 'src/features/products/entities/Product.entity';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePurchaseInvoiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  purchaseInvoiceNumber: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  invoiceDate: Date;

  @ApiProperty({ type: Object })
  @IsObject()
  @IsNotEmpty()
  supplier: Supplier;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  products: Product[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  remarks: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  subTotal: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  total: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalDiscount: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalNetAmount: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  length: number;
}
