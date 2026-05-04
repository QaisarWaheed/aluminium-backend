/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose from 'mongoose';

export enum Unit {
  FT = 'ft',
  PCS = 'pcs',
  KG = 'kg',
  M = 'm',
  SQFT = 'sqft',
}

export enum ProductVariantLength {
  L14 = '14',
  L16 = '16',
  L18 = '18',
}

@Schema()
export class ProductVariant {
  @ApiProperty()
  @Prop({ required: true })
  sku: string;

  @ApiProperty()
  @Prop({ required: true })
  thickness: string;

  @ApiProperty()
  @Prop({ required: true })
  color: string;

  @ApiProperty({ enum: ProductVariantLength })
  @Prop({ required: true, enum: Object.values(ProductVariantLength) })
  length: ProductVariantLength;

  @ApiProperty()
  @Prop({ required: false })
  salesRate?: number;

  @ApiProperty()
  @Prop({ required: true, default: 0 })
  purchasePrice: number;

  @ApiProperty()
  @Prop({ default: 0 })
  openingStock: number;

  @ApiProperty()
  @Prop({ default: 0 })
  availableStock: number;

  @ApiProperty()
  @Prop({ default: 0 })
  minimumStockLevel: number;
}

const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);

@Schema({ timestamps: true })
export class Product {
  declare _id: mongoose.Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true, unique: true })
  itemName: string;

  @ApiProperty({ type: String })
  @Prop({ required: true })
  category: string;

  @ApiProperty({ enum: Unit })
  @Prop({ type: String, enum: Unit, required: true })
  unit: Unit;

  @ApiProperty()
  @Prop()
  description: string;

  @ApiProperty()
  @Prop()
  brand: string;

  @ApiProperty({ type: [ProductVariant] })
  @Prop({ type: [ProductVariantSchema], default: [] })
  variants: ProductVariant[];

  declare createdAt: Date;

  declare updatedAt: Date;
}

const productSchema = SchemaFactory.createForClass(Product);
productSchema.index({ 'variants.sku': 1 }, { unique: true });
productSchema.index({
  itemName: 1,
  'variants.thickness': 1,
  'variants.color': 1,
  'variants.length': 1,
});
productSchema.index({ createdAt: -1 });
export { productSchema };
