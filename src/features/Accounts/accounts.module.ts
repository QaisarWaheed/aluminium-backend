import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JournalVoucher } from './journalVoucher/journalVoucher';
import { ReceiptVoucherModule } from './receiptVoucher/receiptVoucher.module';
import { PaymentVoucherController } from './paymentVoucher/paymentVoucher.controller';
import { PaymentVoucherService } from './paymentVoucher/paymentVoucher.service';
import { paymentVoucherSchema } from './paymentVoucher/paymentVoucher.entity';

@Module({
  imports: [
    JournalVoucher,
    ReceiptVoucherModule,
    MongooseModule.forFeature([
      { name: 'PaymentVoucher', schema: paymentVoucherSchema },
    ]),
  ],
  controllers: [PaymentVoucherController],
  providers: [PaymentVoucherService],
  exports: [PaymentVoucherService],
})
export class AccountsModule {}
