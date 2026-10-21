/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentVoucher } from './paymentVoucher.entity';
import { CreatePaymentVoucherDto } from './createPaymentVoucher.dto';

@Injectable()
export class PaymentVoucherService {
    constructor(
        @InjectModel('PaymentVoucher') private readonly paymentVoucherModel: Model<PaymentVoucher>
    ) { }

    async findAll(): Promise<PaymentVoucher[]> {
        return await this.paymentVoucherModel.find().exec();
    }

    async findByVoucherNumber(voucherNumber: string): Promise<PaymentVoucher | null> {
        return await this.paymentVoucherModel.findOne({ voucherNumber }).exec();
    }

    async create(data: CreatePaymentVoucherDto): Promise<PaymentVoucher> {
        return await this.paymentVoucherModel.create(data);
    }

    async update(voucherNumber: string, data: CreatePaymentVoucherDto): Promise<PaymentVoucher | null> {
        const updatedVoucher = await this.paymentVoucherModel
            .findOneAndUpdate({ voucherNumber }, data, { new: true })
            .exec();

        if (!updatedVoucher) {
            throw new NotFoundException('Payment voucher not found');
        }

        return updatedVoucher;
    }

    async delete(voucherNumber: string): Promise<PaymentVoucher | null> {
        return await this.paymentVoucherModel.findOneAndDelete({ voucherNumber }).exec();
    }
}