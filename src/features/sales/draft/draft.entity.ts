/* eslint-disable prettier/prettier */
import type { DraftData } from '../interfaces/draft-data.interface';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class Draft {

    declare _id: mongoose.Types.ObjectId;

    @Prop({ type: String, required: true, unique: false })
    key: string;

    @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
    data: DraftData;

    @Prop({ type: String, required: false })
    userId?: string;

    @Prop({ type: String, required: false })
    title?: string;

    declare createdAt: Date;
    declare updatedAt: Date;
}

const draftSchema = SchemaFactory.createForClass(Draft);
export default draftSchema;
