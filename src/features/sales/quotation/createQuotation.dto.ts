/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { Product } from 'src/features/products/entities/Product.entity';
import { Customer } from '../customer/entities/customer.entity';

export class CreateQuotationDto {

  @ApiProperty()
  quotationDate: Date;
  @ApiProperty()
  quotationNumber: string;

  @ApiProperty()
  products: Product[];

  @ApiProperty()
  length: string;

  @ApiProperty({ type: [Object], description: 'Array of customer objects' })
  customer: Customer;

  @ApiProperty()
  remarks: string;

  @ApiProperty()
  subTotal: number;

  @ApiProperty()
  totalGrossAmount: number;

  @ApiProperty()
  totalDiscount: number;

  @ApiProperty()
  totalNetAmount: number;

  @ApiProperty()
  discount: number;

}
