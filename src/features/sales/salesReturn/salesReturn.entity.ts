/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Product } from 'src/features/products/entities/Product.entity';

import { Customer } from '../customer/entities/customer.entity';

export type paymentMethodType = 'Cash' | 'Card';

@Schema({ timestamps: true })
export class SalesReturn {
  declare _id: mongoose.Types.ObjectId;

  @Prop()
  invoiceNumber: string;

  @Prop()
  invoiceDate: Date;

  @Prop()
  paymentMethod: paymentMethodType;

  @Prop({ type: [mongoose.Schema.Types.Mixed], required: false })
  products: Product[];

  @Prop({ type: [mongoose.Schema.Types.Mixed], required: false })
  customer: Customer[];

  @Prop()
  remarks: string;

  @Prop()
  subTotal: number;

  @Prop()
  totalGrossAmount: number;

  @Prop()
  totalDiscount: number;

  @Prop()
  discount: number;

  @Prop()
  length: number;

  @Prop()
  totalNetAmount: number;

  declare createdAt: Date;

  declare updatedAt: Date;
}
const salesReturnSchema = SchemaFactory.createForClass(SalesReturn);

export default salesReturnSchema;
