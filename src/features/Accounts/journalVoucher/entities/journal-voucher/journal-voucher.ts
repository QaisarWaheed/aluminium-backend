import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class JournalVoucher {
  @ApiProperty()
  @Prop({ required: true })
  date: Date;

  @ApiProperty()
  @Prop({ required: true })
  voucherNumber: string;

  @ApiProperty()
  @Prop({ required: true })
  accountNumber: string;

  @ApiProperty({ required: false })
  @Prop()
  description?: string;

  @ApiProperty({ required: false })
  @Prop()
  credit?: number;

  @ApiProperty({ required: false })
  @Prop()
  debit?: number;
}

export const JournalVoucherSchema =
  SchemaFactory.createForClass(JournalVoucher);
