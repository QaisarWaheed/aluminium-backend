import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import type { paymentMethodType } from '../../sales/salesInvoice/salesinvoice.entity';

@Schema({ timestamps: true })
export class ReceiptVoucher {
  declare _id: mongoose.Types.ObjectId;

  @Prop()
  voucherNumber: string;

  @Prop()
  voucherDate: Date;

  @Prop()
  receivedFrom: string;

  @Prop()
  amount: number;

  @Prop()
  referenceNumber: string;

  @Prop({ type: String, enum: ['Cash', 'Card'] })
  paymentMode: paymentMethodType;

  @Prop()
  remarks?: string;

  declare createdAt: Date;

  declare updatedAt: Date;
}

const receiptVoucherSchema = SchemaFactory.createForClass(ReceiptVoucher);
export default receiptVoucherSchema;
