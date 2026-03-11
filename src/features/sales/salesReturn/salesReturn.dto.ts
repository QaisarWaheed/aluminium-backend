/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { Product } from 'src/features/products/entities/Product.entity';
import type { paymentMethodType } from './salesReturn.entity';
import { Customer } from '../customer/entities/customer.entity';

export class CreateSalesReturnDto {
  @ApiProperty()
  invoiceNumber: string;

  @ApiProperty()
  invoiceDate: Date;

  @ApiProperty()
  paymentMethod: paymentMethodType;

  @ApiProperty()
  products: Product[];

  @ApiProperty({ type: [Object], description: 'Array of customer objects' })
  customer: Customer[];

  @ApiProperty()
  discount: number;

  @ApiProperty()
  length: number;

  @ApiProperty()
  remarks: string;

  subTotal: number;

  totalGrossAmount: number;

  totalDiscount: number;

  totalNetAmount: number;
}
