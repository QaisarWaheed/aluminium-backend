import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose from 'mongoose';

import { Role } from '../enums/role.enum';

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

  @ApiProperty({ enum: Role, default: Role.CASHIER })
  @Prop({ type: String, enum: Role, default: Role.CASHIER, required: true })
  role: Role;

  declare CreatedAt: Date;
  declare UpdatedAt: Date;
}

const userSchema = SchemaFactory.createForClass(User);
export { userSchema };
