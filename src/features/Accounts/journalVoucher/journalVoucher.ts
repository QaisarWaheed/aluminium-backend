import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JournalVoucherSchema } from './entities/journal-voucher/journal-voucher';
import { JournalVoucherController } from './journal-voucher/journal-voucher.controller';
import { JournalvoucherService } from './services/journalvoucher/journalvoucher.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JournalVoucher.name, schema: JournalVoucherSchema },
    ]),
  ],
  controllers: [JournalVoucherController],
  providers: [JournalvoucherService],
})
export class JournalVoucher {}
