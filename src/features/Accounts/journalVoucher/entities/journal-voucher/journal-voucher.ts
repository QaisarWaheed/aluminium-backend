import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class JournalVoucher {
  @ApiProperty({ required: false })
  @Prop()
  accountId?: string;

  @ApiProperty()
  @Prop({ required: true })
  date: Date;

  @ApiProperty({ required: false })
  @Prop()
  transactionDate?: Date;

  @ApiProperty()
  @Prop({ required: true })
  voucherNumber: string;

  @ApiProperty({ required: false })
  @Prop()
  referenceId?: string;

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

// General ledger indexes for account/date range queries and traceability.
JournalVoucherSchema.index({ accountId: 1, transactionDate: -1 });
JournalVoucherSchema.index({ accountNumber: 1, transactionDate: -1 });
JournalVoucherSchema.index({ referenceId: 1 });
JournalVoucherSchema.index({ voucherNumber: 1, transactionDate: -1 });
