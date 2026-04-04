import { Injectable, BadRequestException, Scope } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { JournalVoucher } from '../../entities/journal-voucher/journal-voucher';
import { CreateJournalVoucherDto } from '../../dtos/create-journal-voucher/create-journal-voucher.dto';

type DoubleEntryInput = {
  voucherNumber: string;
  referenceId: string;
  transactionDate: Date;
  description?: string;
  debitEntry: {
    accountId?: string;
    accountNumber: string;
    amount: number;
  };
  creditEntry: {
    accountId?: string;
    accountNumber: string;
    amount: number;
  };
};

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

  async create(
    createJournalVoucherDto: CreateJournalVoucherDto,
    session?: ClientSession,
  ) {
    const [journalVoucher] = await this.model.create(
      [createJournalVoucherDto],
      {
        session,
      },
    );

    return journalVoucher;
  }

  async createDoubleEntry(input: DoubleEntryInput, session?: ClientSession) {
    const debitAmount = Number(input.debitEntry.amount || 0);
    const creditAmount = Number(input.creditEntry.amount || 0);

    if (debitAmount <= 0 || creditAmount <= 0) {
      throw new BadRequestException(
        'Debit and credit amounts must be greater than zero',
      );
    }

    if (debitAmount !== creditAmount) {
      throw new BadRequestException(
        'Double-entry posting requires debit and credit totals to match',
      );
    }

    const description =
      input.description || `Journal posting - ${input.referenceId}`;
    const transactionDate = input.transactionDate || new Date();

    const entries: CreateJournalVoucherDto[] = [
      {
        accountId: input.debitEntry.accountId,
        accountNumber: input.debitEntry.accountNumber,
        date: transactionDate,
        transactionDate,
        voucherNumber: input.voucherNumber,
        referenceId: input.referenceId,
        description,
        debit: debitAmount,
        credit: 0,
      },
      {
        accountId: input.creditEntry.accountId,
        accountNumber: input.creditEntry.accountNumber,
        date: transactionDate,
        transactionDate,
        voucherNumber: input.voucherNumber,
        referenceId: input.referenceId,
        description,
        debit: 0,
        credit: creditAmount,
      },
    ];

    return await this.model.create(entries, {
      session,
    });
  }

  async findAll(filters?: {
    startDate?: string;
    endDate?: string;
    accountId?: string;
    accountNumber?: string;
  }) {
    const query: {
      date?: { $gte?: Date; $lte?: Date };
      accountId?: string;
      accountNumber?: string;
    } = {};
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (filters?.accountId) {
      query.accountId = filters.accountId;
    }
    if (filters?.accountNumber) {
      query.accountNumber = filters.accountNumber;
    }

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

  async deleteByReferenceId(
    referenceId: string,
    session?: ClientSession,
  ): Promise<void> {
    await this.model.deleteMany(
      { referenceId },
      session ? { session } : undefined,
    );
  }

  async findByVoucherNumber(voucherNumber: string) {
    return await this.model.findOne({ voucherNumber }).exec();
  }

  async updateByVoucherNumber(
    voucherNumber: string,
    updateDto: Partial<CreateJournalVoucherDto>,
    session?: ClientSession,
  ) {
    return await this.model
      .findOneAndUpdate(
        { voucherNumber },
        updateDto,
        session ? { new: true, session } : { new: true },
      )
      .exec();
  }
}
