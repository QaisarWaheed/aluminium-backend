/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { Product } from 'src/features/products/entities/Product.entity';
import type { paymentMethodType } from './salesinvoice.entity';
import { Customer } from '../customer/entities/customer.entity';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSalesInvoiceDto {
  @ApiProperty()
  @IsString()
  invoiceNumber: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  invoiceDate: Date;

  @ApiProperty({ enum: ['Cash', 'Card'], description: 'Payment method used' })
  @IsOptional()
  @IsEnum(['Cash', 'Card'])
  paymentMethod: paymentMethodType;

  @ApiProperty({
    type: [Object],
    description: 'Array of product objects sold in this invoice',
  })
  @IsArray()
  items: Product[];

  @ApiProperty({ type: Object, description: 'Customer object' })
  @IsOptional()
  @IsObject()
  customer: Customer;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty()
  @IsNumber()
  length: number;

  @ApiProperty()
  @IsNumber()
  discount: number;

  @ApiProperty()
  @IsNumber()
  subTotal: number;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNumber()
  totalGrossAmount: number;

  @ApiProperty()
  @IsNumber()
  totalDiscountAmount: number;

  @ApiProperty()
  @IsNumber()
  totalNetAmount: number;

  @ApiProperty()
  @IsNumber()
  receivedAmount: number;

  @ApiProperty()
  @IsNumber()
  pendingAmount: number;
}
