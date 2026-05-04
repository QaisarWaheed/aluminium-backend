import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from 'src/features/products/entities/Product.entity';

export class CreatePurchaseReturnDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  returnNumber: string;

  @ApiProperty()
  @IsDateString()
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
  @Min(0)
  @IsOptional()
  subTotal: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  total: number;
}
