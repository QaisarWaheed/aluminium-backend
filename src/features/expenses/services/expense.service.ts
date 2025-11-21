/* eslint-disable prettier/prettier */
import { BadRequestException, HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Expense } from '../expenses.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateExpensesDto } from '../expenses.dto';
import { PaymentVoucher } from '../../Accounts/paymentVoucher/paymentVoucher.entity';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectModel('Expense') private readonly expenseModel: Model<Expense>,
    @InjectModel('PaymentVoucher') private readonly paymentVoucherModel: Model<PaymentVoucher>,
  ) { }

  async findAll(): Promise<Expense[]> {
    try {
      return await this.expenseModel.find().exec();
    } catch (error) {
      console.log(error)
      throw new Error('Error fetching products', error);
    }
  }

  async findById(expenseNumber: string): Promise<Expense | null> {
    try {
      const expense = await this.expenseModel.findOne({ expenseNumber }).exec();
      if (!expense) {
        throw new HttpException('No Product Found Against this Id', 404);
      }
      return expense;
    } catch (error) {
      throw new Error('Error fetching product by ID');
    }
  }

  async addExpense(expense: CreateExpensesDto): Promise<Expense> {
    try {
      const newExpense = new this.expenseModel(expense);
      const saved = await newExpense.save();

      // Create a payment voucher for this expense so ledger/reporting picks it up
      try {
        const amt = (saved as any).amount || 0;
        const pMethod = (saved as any).paymentMethod;
        if (amt > 0 && (pMethod === 'Cash' || pMethod === 'Card')) {
          const voucher = {
            voucherNumber: `PV-${Date.now()}`,
            voucherDate: (saved as any).date || new Date(),
            paidTo: (saved as any).description || 'Expense',
            amount: amt,
            referenceNumber: (saved as any).expenseNumber || '',
            paymentMode: pMethod,
            remarks: (saved as any).remarks || '',
          };
          // create voucher but do not block expense creation if this fails
          await this.paymentVoucherModel.create(voucher);
        }
      } catch (err) {
        // best-effort: log and continue
        console.warn('Failed to create payment voucher for expense:', err?.message ?? err);
      }

      return saved;
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException(error.message);
    }
  }

  async updateExpense(
    expenseNumber: string,
    expense: Partial<CreateExpensesDto>,
  ): Promise<Expense | null> {
    try {
      return await this.expenseModel
        .findOneAndUpdate({ expenseNumber }, expense, { new: true })
        .exec();
    } catch (error) {
      throw new Error('Error updating product');
    }
  }

  async deleteExpense(expenseNumber: string): Promise<Expense | null> {
    return await this.expenseModel.findOneAndDelete({ expenseNumber }).exec();
  }
}
