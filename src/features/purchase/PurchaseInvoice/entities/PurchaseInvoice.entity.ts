/* eslint-disable prettier/prettier */
import mongoose from "mongoose";

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Supplier } from "../../supplier/supplier.entity";
import { Product } from "src/features/products/entities/Product.entity";

@Schema({ timestamps: true })
export class PurchaseInvoice {

    declare _id: mongoose.Types.ObjectId

    @Prop()
    purchaseInvoiceNumber: string;

    @Prop()
    invoiceDate: Date



    @Prop({ type: Object })
    supplier: Supplier

    @Prop()
    products: Product[]

    @Prop()
    remarks: string

    @Prop()
    subTotal: number


    @Prop()
    total: number

    @Prop()
    totalDiscount: number

    @Prop()
    discount: number
    @Prop()
    totalNetAmount: number

    @Prop()
    length: number



    declare createAt: Date

    declare updatedAt: Date

}

const purchaseInvoiceSchema = SchemaFactory.createForClass(PurchaseInvoice)
export default purchaseInvoiceSchema