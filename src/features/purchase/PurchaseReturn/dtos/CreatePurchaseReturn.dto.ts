/* eslint-disable prettier/prettier */
import { ApiProperty } from "@nestjs/swagger";
import { Product } from "src/features/products/entities/Product.entity";

export class CreatePurchaseReturnDto {

  @ApiProperty()
  returnNumber: string;

  @ApiProperty()
  returnDate: Date;

  // supplier name (string)
  @ApiProperty()
  supplier: string

  // reference to supplier id
  @ApiProperty()
  supplierId?: string;

  @ApiProperty()
  products: Product[];

  @ApiProperty()
  reason: string;

  @ApiProperty()
  subTotal: number;

  @ApiProperty()
  total: number;


}