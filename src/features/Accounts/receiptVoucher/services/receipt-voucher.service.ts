import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ReceiptVoucher } from '../receipt.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateReceiptVoucherDto } from '../createReceipt.dto';

@Injectable()
export class ReceiptVoucherService {
  constructor(
    @InjectModel('ReceiptVoucher')
    private readonly receiptVoucherModel: Model<ReceiptVoucher>,
  ) {}

  async findAll(): Promise<ReceiptVoucher[]> {
    try {
      return await this.receiptVoucherModel.find().exec();
    } catch {
      throw new InternalServerErrorException(
        'Failed to fetch receipt vouchers',
      );
    }
  }

  async findById(id: string): Promise<ReceiptVoucher> {
    try {
      const receiptVoucher = await this.receiptVoucherModel.findById(id).exec();
      if (!receiptVoucher) {
        throw new NotFoundException(`Receipt voucher ${id} not found`);
      }
      return receiptVoucher;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to fetch receipt voucher');
    }
  }

  async addReceiptVoucher(
    voucher: CreateReceiptVoucherDto,
  ): Promise<ReceiptVoucher> {
    try {
      return await this.receiptVoucherModel.create(voucher);
    } catch {
      throw new InternalServerErrorException(
        'Failed to create receipt voucher',
      );
    }
  }

  async updateReceiptVoucher(
    id: string,
    voucher: Partial<CreateReceiptVoucherDto>,
  ): Promise<ReceiptVoucher> {
    try {
      const updatedVoucher = await this.receiptVoucherModel
        .findByIdAndUpdate(id, voucher, { new: true })
        .exec();

      if (!updatedVoucher) {
        throw new NotFoundException(`Receipt voucher ${id} not found`);
      }

      return updatedVoucher;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to update receipt voucher',
      );
    }
  }

  async deleteReceiptVoucher(id: string): Promise<ReceiptVoucher> {
    const deletedVoucher = await this.receiptVoucherModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedVoucher) {
      throw new NotFoundException(`Receipt voucher ${id} not found`);
    }

    return deletedVoucher;
  }
}
