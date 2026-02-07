/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

import { Product } from "src/features/products/entities/Product.entity";
import { Supplier } from "../../supplier/supplier.entity";

@Schema({ timestamps: true })
export class PurchaseOrder {

    declare _id: mongoose.Types.ObjectId

    @Prop()
    poNumber: string;

    @Prop()
    poDate: Date

    @Prop()
    expectedDelivery: Date

    @Prop({ type: Object })
    supplier: Supplier

    @Prop()
    products: Product[]

    @Prop()
    remarks: string

    subTotal: number

    total: number

    declare createAt: Date
    declare updatedAt: Date


}

const purchaseOrderSchema = SchemaFactory.createForClass(PurchaseOrder)
export default purchaseOrderSchema