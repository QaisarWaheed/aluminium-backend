import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Unit } from '../entities/Product.entity';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  thickness: number;

  @ApiProperty({ enum: Unit })
  @IsEnum(Unit)
  @IsOptional()
  unit: Unit;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  salesRate: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  color: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  openingStock: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  minimumStockLevel: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  brand: string;
}
