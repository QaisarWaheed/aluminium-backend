/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from 'mongoose';
import { Product } from 'src/features/products/entities/Product.entity';
import { Customer } from "../customer/entities/customer.entity";

export type paymentMethodType = 'Cash' | 'Card';

@Schema({ timestamps: true })
export class SalesInvoice {

    declare _id: mongoose.Types.ObjectId;

    @Prop({ type: String })
    invoiceNumber: string;

    @Prop({ type: Date })
    invoiceDate: Date;

    // ✅ Explicit type for union
    @Prop({ type: String, enum: ['Cash', 'Card'], required: false })
    paymentMethod: paymentMethodType;

    // store full product objects inside the invoice so frontend can show product details
    @Prop({ type: [mongoose.Schema.Types.Mixed], required: false })
    items: Product[];

    // store full customer object (embedded) so backend receives full customer data
    @Prop({ type: [mongoose.Schema.Types.Mixed], required: false })
    customer: Customer[];

    @Prop({ type: String })
    remarks: string;

    @Prop({ type: Number })
    length: number;

    @Prop({ type: Number })
    discount: number;

    @Prop({ type: Number })
    amount: number;

    @Prop({ type: Number })
    subTotal: number;

    @Prop({ type: Number })
    totalGrossAmount: number;

    @Prop({ type: Number })
    totalDiscount: number;

    @Prop({ type: Number })
    totalNetAmount: number;

    @Prop({ type: Number, default: 0 })
    receivedAmount: number;

    @Prop({ type: Number, default: 0 })
    pendingAmount: number;

    declare createdAt: Date;
    declare updatedAt: Date;
}

const salesInvoiceSchema = SchemaFactory.createForClass(SalesInvoice);
export default salesInvoiceSchema;
