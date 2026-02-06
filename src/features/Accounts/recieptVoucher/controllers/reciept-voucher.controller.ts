import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { RecieptVoucherService } from '../services/reciept-voucher.service';
import { CreateRecipetVoucherDto } from '../createReciept.dto';

@Controller('reciept-voucher')
export class RecieptVoucherController {
  constructor(private readonly recieptVoucher: RecieptVoucherService) {}

  @Get()
  async getAllReceiptVouchers() {
    return this.recieptVoucher.findAll();
  }

  @Get('/:id')
  async getReceiptVoucherById(@Param('id') id: string) {
    return this.recieptVoucher.findById(id);
  }

  @Post()
  async createReceiptVoucher(@Body() data: CreateRecipetVoucherDto) {
    return this.recieptVoucher.addReceiptVoucher(data);
  }

  @Put('/:id')
  async updateReceiptVoucher(@Param('id') id: string, @Body() data: any) {
    return this.recieptVoucher.updateReceiptVoucher(id, data);
  }

  @Delete('/:id')
  async deleteReceiptVoucher(@Param('id') id: string) {
    return this.recieptVoucher.deleteReceiptVoucher(id);
  }
}
