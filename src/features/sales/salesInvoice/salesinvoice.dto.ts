/* eslint-disable prettier/prettier */
import { ApiProperty } from "@nestjs/swagger";
import { Product } from "src/features/products/entities/Product.entity";
import type { paymentMethodType } from "./salesinvoice.entity";
import { Customer } from "../customer/entities/customer.entity";

export class CreateSalesInvoiceDto {
    @ApiProperty()
    invoiceNumber: string;

    @ApiProperty({ type: String, format: 'date-time' })
    invoiceDate: Date;

    @ApiProperty({ enum: ['Cash', 'Card'], description: 'Payment method used' })
    paymentMethod: paymentMethodType;

    @ApiProperty({
        type: [Object],
        description: 'Array of product objects sold in this invoice'
    })
    items: Product[];

    @ApiProperty({ type: [Object], description: 'Array of customer objects' })
    customer: Customer;

    @ApiProperty()
    remarks?: string;

    @ApiProperty()
    length: number;

    @ApiProperty()
    discount: number;

    @ApiProperty()
    subTotal: number;

    @ApiProperty()
    amount: number;

    @ApiProperty()
    totalGrossAmount: number;

    @ApiProperty()
    totalDiscountAmount: number;

    @ApiProperty()
    totalNetAmount: number;

    @ApiProperty()
    receivedAmount: number;

    @ApiProperty()
    pendingAmount: number;
}
