import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  IsArray,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from 'src/features/products/entities/Product.entity';

export class CreatePurchaseReturnDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  returnNumber: string;

  @ApiProperty()
  @IsOptional()
  returnDate: Date;

  // supplier name (string)
  @ApiProperty()
  @IsString()
  @IsOptional()
  supplier: string;

  // reference to supplier id
  @ApiProperty()
  @IsString()
  @IsOptional()
  supplierId?: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  products: Product[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  reason: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  subTotal: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  total: number;
}
