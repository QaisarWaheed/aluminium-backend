import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export enum SessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

@Schema({ timestamps: true })
export class Session {
  declare _id: mongoose.Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: Date, required: true, default: Date.now })
  startTime: Date;

  @Prop({ type: Date, required: false })
  endTime?: Date;

  @Prop({ type: Number, required: true, min: 0 })
  openingBalance: number;

  @Prop({ type: Number, required: false, min: 0 })
  closingBalance?: number;

  @Prop({ type: String, enum: SessionStatus, default: SessionStatus.OPEN })
  status: SessionStatus;

  declare createdAt: Date;
  declare updatedAt: Date;
}

export const sessionSchema = SchemaFactory.createForClass(Session);
sessionSchema.index({ userId: 1, status: 1 });
sessionSchema.index({ createdAt: -1 });
