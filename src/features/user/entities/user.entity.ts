import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { mongo } from 'mongoose';

@Schema()
export class User {
  declare _id: mongoose.Types.ObjectId;

  @ApiProperty({ required: true })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ required: true, uniqueItems: true })
  @Prop({ required: true, unique: true })
  email: string;

  @ApiProperty({ required: true })
  @Prop({ required: true })
  password: string;

  declare CreatedAt: Date;
  declare UpdatedAt: Date;
}

const userSchema = SchemaFactory.createForClass(User);
export { userSchema };
