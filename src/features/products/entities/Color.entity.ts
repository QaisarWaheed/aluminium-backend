/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class Color {
    declare _id: mongoose.Types.ObjectId;

    @ApiProperty()
    @Prop({ required: true, unique: true })
    name: string;

    @ApiProperty()
    @Prop()
    description: string;

    declare createdAt: Date;

    declare updatedAt: Date;
}

const colorSchema = SchemaFactory.createForClass(Color);
export { colorSchema };
