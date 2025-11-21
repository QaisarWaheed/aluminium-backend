import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import expenseSchema from './expenses.entity';
import { paymentVoucherSchema } from '../Accounts/paymentVoucher/paymentVoucher.entity';
import { ExpenseController } from './controllers/expense.controller';
import { ExpenseService } from './services/expense.service';

@Module({

    imports: [MongooseModule.forFeature([
        { name: 'Expense', schema: expenseSchema },
        { name: 'PaymentVoucher', schema: paymentVoucherSchema },
    ])],
    controllers: [ExpenseController],
    providers: [ExpenseService]



})
export class ExpenseModule { }
