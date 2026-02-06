/* eslint-disable prettier/prettier */
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ExpenseService } from '../services/expense.service';
import { CreateExpensesDto } from '../expenses.dto';

@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) { }

  @Get()
  async getAllExpenses() {
    return await this.expenseService.findAll();
  }

  @Get('/:expenseNumber')
  async getExpenseById(@Param('expenseNumber') expenseNumber: string) {
    return this.expenseService.findById(expenseNumber);
  }

  @Post()
  async createExpense(@Body() expense: CreateExpensesDto) {

    return await this.expenseService.addExpense(expense);
  }

  @Put('/:expenseNumber')
  async updateExpense(@Param('expenseNumber') expenseNumber: string, @Body() expense: CreateExpensesDto) {
    return await this.expenseService.updateExpense(expenseNumber, expense);
  }

  @Delete('/:expenseNumber')
  async deleteExpense(@Param('expenseNumber') expenseNumber: string) {
    return await this.expenseService.deleteExpense(expenseNumber);
  }
}
