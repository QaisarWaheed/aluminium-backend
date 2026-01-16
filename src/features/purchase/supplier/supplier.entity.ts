/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose from 'mongoose';
import { PaymentType } from 'src/features/sales/customer/entities/customer.entity';

@Schema({ timestamps: true })
export class Supplier {
  declare _id: mongoose.Types.ObjectId;

  @ApiProperty()
  @Prop()
  name: string;

  @ApiProperty()
  @Prop()
  phone: string;

  @ApiProperty()
  @Prop()
  email: string;

  @ApiProperty()
  @Prop()
  address: string;

  @ApiProperty()
  @Prop()
  city: string;

  @ApiProperty()
  @Prop()
  openingBalance: number;

  @ApiProperty({ enum: PaymentType })
  @Prop({ enum: PaymentType })
  paymentType: PaymentType;

  declare createdAt: Date;

  declare updatedAt: Date;
}
const SupplierSchema = SchemaFactory.createForClass(Supplier);
export { SupplierSchema };
