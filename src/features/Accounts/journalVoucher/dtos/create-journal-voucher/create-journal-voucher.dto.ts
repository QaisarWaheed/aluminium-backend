import { ApiProperty } from '@nestjs/swagger';

export class CreateJournalVoucherDto {
  @ApiProperty()
  date: Date;

  @ApiProperty()
  voucherNumber: string;

  @ApiProperty()
  accountNumber: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  credit?: number;

  @ApiProperty({ required: false })
  debit?: number;
}
