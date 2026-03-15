import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Unit } from '../entities/Product.entity';

export class CreateProductVariantDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  sku?: string; // Auto-generated, but can be provided

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  thickness: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiProperty()
  @IsNumber()
  salesRate: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  openingStock?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  availableStock?: number; // Current available stock

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  minimumStockLevel?: number;
}

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ enum: Unit })
  @IsEnum(Unit)
  unit: Unit;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiProperty({ type: [CreateProductVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants: CreateProductVariantDto[];
}
