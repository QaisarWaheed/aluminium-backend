import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import type { paymentMethodType } from 'src/features/sales/salesInvoice/salesinvoice.entity';

@Schema({ timestamps: true })
export class RecieptVoucher {
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

  @Prop()
  paymentMode: paymentMethodType;

  @Prop()
  remarks?: string;

  declare createdAt: Date;

  declare updatedAt: Date;
}

const recieptVoucherSchema = SchemaFactory.createForClass(RecieptVoucher);
export default recieptVoucherSchema;
