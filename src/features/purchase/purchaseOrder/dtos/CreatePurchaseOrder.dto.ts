import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsDateString,
  IsObject,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { Product } from 'src/features/products/entities/Product.entity';

import { Supplier } from '../../supplier/supplier.entity';

export class CreatePurchaseOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  poNumber: string;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  poDate: Date;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  expectedDelivery: Date;

  @ApiProperty({ type: Object })
  @IsObject()
  @IsOptional()
  supplier: Supplier;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  products: Product[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  remarks: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  subTotal: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  total: number;
}
