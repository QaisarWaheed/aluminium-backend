import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ReceiptVoucherService } from '../services/receipt-voucher.service';
import { CreateReceiptVoucherDto } from '../createReceipt.dto';

@Controller('receipt-voucher')
export class ReceiptVoucherController {
  constructor(private readonly receiptVoucherService: ReceiptVoucherService) {}

  @Get()
  async getAllReceiptVouchers() {
    return this.receiptVoucherService.findAll();
  }

  @Get('/:id')
  async getReceiptVoucherById(@Param('id') id: string) {
    return this.receiptVoucherService.findById(id);
  }

  @Post()
  async createReceiptVoucher(@Body() data: CreateReceiptVoucherDto) {
    return this.receiptVoucherService.addReceiptVoucher(data);
  }

  @Put('/:id')
  async updateReceiptVoucher(
    @Param('id') id: string,
    @Body() data: Partial<CreateReceiptVoucherDto>,
  ) {
    return this.receiptVoucherService.updateReceiptVoucher(id, data);
  }

  @Delete('/:id')
  async deleteReceiptVoucher(@Param('id') id: string) {
    return this.receiptVoucherService.deleteReceiptVoucher(id);
  }
}
