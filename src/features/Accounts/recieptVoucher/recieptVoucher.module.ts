import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import recieptVoucherSchema from './reciept.entity';
import { RecieptVoucherController } from './controllers/reciept-voucher.controller';
import { RecieptVoucherService } from './services/reciept-voucher.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'RecieptVoucher', schema: recieptVoucherSchema },
    ]),
  ],
  controllers: [RecieptVoucherController],
  providers: [RecieptVoucherService],
})
export class RecieptVoucher {}
