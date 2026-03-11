/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SalesReturnService } from '../../services/sale-invoice/sale-return.service';
import { CreateSalesReturnDto } from '../../salesReturn.dto';

@ApiTags('sale-Return')
@Controller('sale-return')
export class SalesReturnController {
  constructor(private readonly salesReturnService: SalesReturnService) {}

  @Get()
  async findAll() {
    return await this.salesReturnService.findAll();
  }

  @Get('/:invoiceNumber')
  async findByInvoiceNumber(@Param('invoiceNumber') invoiceNumber: string) {
    return await this.salesReturnService.findByInvoiceNumber(invoiceNumber);
  }

  @Post()
  async createInvoice(@Body() data: CreateSalesReturnDto) {
    return await this.salesReturnService.createInvoice(data);
  }

  @Put('/:invoiceNumber')
  async updateInvoice(
    @Param('invoiceNumber') invoiceNumber: string,
    @Body() data: CreateSalesReturnDto,
  ) {
    return await this.salesReturnService.updateInvoice(invoiceNumber, data);
  }

  @Delete('/:invoiceNumber')
  async deleteInvoice(@Param('invoiceNumber') invoiceNumber: string) {
    return await this.salesReturnService.deleteInvoice(invoiceNumber);
  }
}
