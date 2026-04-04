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
import { Transform } from 'class-transformer';
import { Product } from 'src/features/products/entities/Product.entity';
import { Customer } from '../customer/entities/customer.entity';

export class CreateQuotationDto {
  @ApiProperty()
  @IsDateString()
  quotationDate!: Date;

  @ApiProperty()
  @IsString()
  quotationNumber!: string;

  @ApiProperty()
  @IsArray()
  @IsObject({ each: true })
  products!: Product[];

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === undefined ? undefined : String(value),
  )
  @IsString()
  length?: string;

  @ApiProperty({ type: [Object], description: 'Array of customer objects' })
  @IsOptional()
  @IsObject()
  customer?: Customer;

  @ApiProperty()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  subTotal?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  totalGrossAmount?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  totalDiscount?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  totalNetAmount?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  discount?: number;
}
