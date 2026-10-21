/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Product } from 'src/features/products/entities/Product.entity';
import { Customer } from '../customer/entities/customer.entity';

export type paymentMethodType = 'Cash' | 'Card' | 'Cheque' | 'Credit';

@Schema({ timestamps: true })
export class Quotation {
  declare _id: mongoose.Types.ObjectId;
  @Prop()
  quotationNumber: string;

  @Prop()
  quotationDate: Date;
  @Prop()
  products: Product[];

  @Prop({ type: [mongoose.Schema.Types.Mixed], required: false })
  customer: Customer[];

  @Prop()
  remarks: string;

  @Prop()
  subTotal: number;

  @Prop()
  totalGrossAmmount: number;

  @Prop()
  discount: number;

  @Prop()
  totalDiscount: number;

  @Prop()
  totalNetAmmount: number;

  @Prop()
  length: string;

  declare createdAt: Date;

  declare updatedAt: Date;
}
const quotationSchema = SchemaFactory.createForClass(Quotation);

export default quotationSchema;
