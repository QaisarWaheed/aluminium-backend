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
import { Transform } from 'class-transformer';
import { Product } from 'src/features/products/entities/Product.entity';
import { Customer } from '../customer/entities/customer.entity';

export class CreateQuotationDto {
  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  quotationDate!: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  quotationNumber!: string;

  @ApiProperty()
  @IsArray()
  @IsObject({ each: true })
  @IsNotEmpty()
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
  @Min(0)
  subTotal?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalGrossAmount?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalDiscount?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalNetAmount?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}
