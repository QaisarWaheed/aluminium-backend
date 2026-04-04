import { ApiProperty } from '@nestjs/swagger';

export class CreateJournalVoucherDto {
  @ApiProperty({ required: false })
  accountId?: string;

  @ApiProperty()
  date: Date;

  @ApiProperty({ required: false })
  transactionDate?: Date;

  @ApiProperty()
  voucherNumber: string;

  @ApiProperty({ required: false })
  referenceId?: string;

  @ApiProperty()
  accountNumber: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  credit?: number;

  @ApiProperty({ required: false })
  debit?: number;
}
