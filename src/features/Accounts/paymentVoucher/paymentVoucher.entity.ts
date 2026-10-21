/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class PaymentVoucher {
    declare _id: mongoose.Types.ObjectId;

    @ApiProperty({ required: true })
    @Prop({ required: true })
    voucherNumber: string;

    @ApiProperty({ required: true })
    @Prop({ required: true })
    voucherDate: Date;

    @ApiProperty({ required: true })
    @Prop({ required: true })
    paidTo: string;

    @ApiProperty({ required: true })
    @Prop({ required: true })
    amount: number;

    @ApiProperty({ required: true })
    @Prop({ required: true })
    referenceNumber: string;

    @ApiProperty({ required: true })
    @Prop({ required: true })
    paymentMode: string;

    @ApiProperty({ required: false })
    @Prop({ required: false })
    remarks?: string;

    declare createdAt: Date;
    declare updatedAt: Date;
}

export const paymentVoucherSchema = SchemaFactory.createForClass(PaymentVoucher);