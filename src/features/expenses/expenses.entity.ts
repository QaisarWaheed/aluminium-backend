/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import mongoose, { mongo } from "mongoose";
import type { paymentMethodType } from "../sales/salesInvoice/salesinvoice.entity";

@Schema({ timestamps: true })
export class Expense {

    declare _id: mongoose.Types.ObjectId;

    @Prop()
    expenseNumber: string;

    @Prop()
    date: Date;

    @Prop()
    description: string;

    @Prop()
    amount: number;

    @Prop({ type: String, enum: ['Cash', 'Card'], required: false })
    paymentMethod: paymentMethodType;

    @Prop()
    reference: string;

    @Prop()
    remarks: string;

    @Prop()
    categoryType: string;

    declare createdAt: Date;

    declare updatedAt: Date;


}
const expenseSchema = SchemaFactory.createForClass(Expense);

export default expenseSchema;