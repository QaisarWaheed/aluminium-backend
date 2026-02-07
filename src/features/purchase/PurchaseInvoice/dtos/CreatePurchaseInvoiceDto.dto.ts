/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { Supplier } from '../../supplier/supplier.entity';
import { Product } from 'src/features/products/entities/Product.entity';

export class CreatePurchaseInvoiceDto {
  purchaseInvoiceNumber: string;

  @ApiProperty()
  invoiceDate: Date;



  @ApiProperty({ type: Object })
  supplier: Supplier;

  @ApiProperty()
  products: Product[];

  @ApiProperty()
  remarks: string;

  @ApiProperty()
  subTotal: number;



  @ApiProperty()
  total: number

  @ApiProperty()
  totalDiscount: number

  @ApiProperty()
  discount: number
  @ApiProperty()
  totalNetAmount: number

  @ApiProperty()
  length: number





}
