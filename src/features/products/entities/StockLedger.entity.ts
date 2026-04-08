/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose from 'mongoose';

export enum StockTransactionType {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
  OPENING_STOCK = 'OPENING_STOCK',
  RETURN = 'RETURN',
  DAMAGE = 'DAMAGE',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true })
export class StockLedger {
  declare _id: mongoose.Types.ObjectId;

  @ApiProperty({ enum: StockTransactionType })
  @Prop({ type: String, enum: StockTransactionType, required: true })
  transactionType!: StockTransactionType;

  @ApiProperty()
  @Prop()
  referenceId?: string; // Invoice ID, PO ID, etc.

  @ApiProperty()
  @Prop({ required: true })
  productId!: mongoose.Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  sku!: string; // Variant SKU

  @ApiProperty({ required: false })
  @Prop()
  brand?: string;

  @ApiProperty({ required: false })
  @Prop()
  length?: string;

  @ApiProperty()
  @Prop({ required: true })
  quantityChange!: number; // Positive for inward, negative for outward

  @ApiProperty()
  @Prop({ required: true })
  previousStock!: number;

  @ApiProperty()
  @Prop({ required: true })
  newStock!: number;

  @ApiProperty()
  @Prop()
  notes?: string;

  @ApiProperty()
  @Prop()
  createdBy?: string; // User ID who performed the transaction

  declare createdAt: Date;

  declare updatedAt: Date;
}

export const StockLedgerSchema = SchemaFactory.createForClass(StockLedger);

// Indexes for efficient queries
StockLedgerSchema.index({ sku: 1, createdAt: -1 });
StockLedgerSchema.index({ productId: 1, createdAt: -1 });
StockLedgerSchema.index({ transactionType: 1, createdAt: -1 });
StockLedgerSchema.index({ referenceId: 1 });
StockLedgerSchema.index({ createdAt: -1 });
