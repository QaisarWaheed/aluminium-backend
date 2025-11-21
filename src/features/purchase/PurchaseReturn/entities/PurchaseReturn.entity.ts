/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Product } from "src/features/products/entities/Product.entity";
import mongoose from "mongoose";

@Schema({ timestamps: true })
export class PurchaseReturn {


    declare _id: mongoose.Types.ObjectId

    @Prop()
    returnNumber: string

    @Prop()
    returnDate: Date

    @Prop()
    // store supplier name
    supplier: string

    @Prop()
    // store supplier id reference
    supplierId: string

    @Prop()
    products: Product[]


    @Prop()
    reason: string

    @Prop()
    subTotal: number

    @Prop()
    total: number

    declare createAt: Date

    declare updatedAt: Date


}

const purchaseReturnSchema = SchemaFactory.createForClass(PurchaseReturn)
export default purchaseReturnSchema