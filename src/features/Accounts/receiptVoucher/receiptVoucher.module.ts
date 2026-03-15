import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import receiptVoucherSchema from './receipt.entity';
import { ReceiptVoucherController } from './controllers/receipt-voucher.controller';
import { ReceiptVoucherService } from './services/receipt-voucher.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ReceiptVoucher', schema: receiptVoucherSchema },
    ]),
  ],
  controllers: [ReceiptVoucherController],
  providers: [ReceiptVoucherService],
})
export class ReceiptVoucherModule {}
