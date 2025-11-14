/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import type { Unit } from '../entities/Product.entity';

export class CreateProductDto {



  @ApiProperty()
  itemName: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  thickness: number;

  @ApiProperty()
  unit: Unit;

  @ApiProperty()
  salesRate: number;

  @ApiProperty()
  color: string;

  @ApiProperty()
  openingStock: number;

  @ApiProperty()
  minimumStockLevel: number;

  @ApiProperty()
  description: string;

  @ApiProperty()
  brand: string;
}
