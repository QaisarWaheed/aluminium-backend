/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose from 'mongoose';

export enum PaymentType {
  CREDIT = 'Credit',
  DEBIT = 'Debit',
}

@Schema({ timestamps: true })
export class Customer {
  declare _id: mongoose.Types.ObjectId;
  @ApiProperty()
  @Prop({ required: true })
  name: string;

  @ApiProperty()
  @Prop()
  phone: string;

  @ApiProperty()
  @Prop()
  address: string;

  @ApiProperty()
  @Prop()
  city: string;

  @ApiProperty()
  @Prop()
  openingAmount: number;

  @ApiProperty()
  @Prop()
  creditLimit: number;

  @ApiProperty({ enum: PaymentType })
  @Prop({ enum: PaymentType })
  paymentType: PaymentType;

  declare createdAt: Date;

  declare updatedAt: Date;
}
const customerSchema = SchemaFactory.createForClass(Customer);

export default customerSchema;
