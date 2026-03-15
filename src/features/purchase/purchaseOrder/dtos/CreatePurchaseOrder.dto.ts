import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
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
  @IsOptional()
  poDate: Date;

  @ApiProperty()
  @IsOptional()
  expectedDelivery: Date;

  @ApiProperty({ type: Object })
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
  @IsOptional()
  subTotal: number;

  @IsNumber()
  @IsOptional()
  total: number;
}
