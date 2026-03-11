/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Expense } from '../expenses.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateExpensesDto } from '../expenses.dto';
import { PaymentVoucher } from '../../Accounts/paymentVoucher/paymentVoucher.entity';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectModel('Expense') private readonly expenseModel: Model<Expense>,
    @InjectModel('PaymentVoucher')
    private readonly paymentVoucherModel: Model<PaymentVoucher>,
  ) {}

  async findAll(): Promise<Expense[]> {
    try {
      return await this.expenseModel.find().exec();
    } catch {
      throw new InternalServerErrorException('Failed to fetch expenses');
    }
  }

  async findById(expenseNumber: string): Promise<Expense | null> {
    try {
      const expense = await this.expenseModel.findOne({ expenseNumber }).exec();
      if (!expense) {
        throw new NotFoundException(`Expense ${expenseNumber} not found`);
      }
      return expense;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to fetch expense');
    }
  }

  async addExpense(expense: CreateExpensesDto): Promise<Expense> {
    try {
      const newExpense = new this.expenseModel(expense);
      const saved = await newExpense.save();

      // Create a payment voucher for this expense so ledger/reporting picks it up
      try {
        const amt = saved.amount || 0;
        const pMethod = saved.paymentMethod;
        if (amt > 0 && (pMethod === 'Cash' || pMethod === 'Card')) {
          const voucher = {
            voucherNumber: `PV-${Date.now()}`,
            voucherDate: saved.date || new Date(),
            paidTo: saved.description || 'Expense',
            amount: amt,
            referenceNumber: saved.expenseNumber || '',
            paymentMode: pMethod,
            remarks: saved.remarks || '',
          };
          // create voucher but do not block expense creation if this fails
          await this.paymentVoucherModel.create(voucher);
        }
      } catch (err: unknown) {
        // best-effort: log and continue
        console.warn(
          'Failed to create payment voucher for expense:',
          err instanceof Error ? err.message : err,
        );
      }

      return saved;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  async updateExpense(
    expenseNumber: string,
    expense: Partial<CreateExpensesDto>,
  ): Promise<Expense | null> {
    try {
      const updatedExpense = await this.expenseModel
        .findOneAndUpdate({ expenseNumber }, expense, { new: true })
        .exec();

      if (!updatedExpense) {
        throw new NotFoundException(`Expense ${expenseNumber} not found`);
      }

      return updatedExpense;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to update expense');
    }
  }

  async deleteExpense(expenseNumber: string): Promise<Expense | null> {
    return await this.expenseModel.findOneAndDelete({ expenseNumber }).exec();
  }
}
