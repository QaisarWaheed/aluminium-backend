import { Injectable, BadRequestException, Inject, Scope } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JournalVoucher } from '../../entities/journal-voucher/journal-voucher';
import { CreateJournalVoucherDto } from '../../dtos/create-journal-voucher/create-journal-voucher.dto';
import { REQUEST } from '@nestjs/core';

function parseMMDDYYYY(dateStr?: string): Date | undefined {
  if (!dateStr) return undefined;
  const regex = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/\d{4}$/;
  if (!regex.test(dateStr))
    throw new BadRequestException('Date must be in mm/dd/yyyy format');
  const [month, day, year] = dateStr.split('/');
  const paddedMonth = month.padStart(2, '0');
  const paddedDay = day.padStart(2, '0');
  return new Date(`${year}-${paddedMonth}-${paddedDay}`);
}

@Injectable({ scope: Scope.REQUEST })
export class JournalvoucherService {
  constructor(
    @InjectModel(JournalVoucher.name)
    private model: Model<JournalVoucher>,
  ) {}

  async create(createJournalVoucherDto: CreateJournalVoucherDto) {
    return await this.model.create(createJournalVoucherDto);
  }

  async findAll(filters?: { startDate?: string; endDate?: string }) {
    const query: any = {};
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (filters?.startDate) {
      startDate = parseMMDDYYYY(filters.startDate);
      if (!startDate) throw new BadRequestException('Invalid start date');
      startDate.setHours(0, 0, 0, 0);
    }
    if (filters?.endDate) {
      endDate = parseMMDDYYYY(filters.endDate);
      if (!endDate) throw new BadRequestException('Invalid end date');
      endDate.setHours(23, 59, 59, 999);
    }
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }
    return await this.model.find(query).exec();
  }

  async findByVoucherNumber(voucherNumber: string) {
    return await this.model.findOne({ voucherNumber }).exec();
  }

  async updateByVoucherNumber(
    voucherNumber: string,
    updateDto: Partial<CreateJournalVoucherDto>,
  ) {
    return await this.model
      .findOneAndUpdate({ voucherNumber }, updateDto, { new: true })
      .exec();
  }
}
