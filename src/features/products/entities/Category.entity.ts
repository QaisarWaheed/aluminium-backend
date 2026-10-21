import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class Category {
  declare _id: mongoose.Types.ObjectId;

  @Prop({ required: true, unique: true })
  name: string;

  declare createdAt: Date;
  declare updatedAt: Date;
}

export const categorySchema = SchemaFactory.createForClass(Category);
