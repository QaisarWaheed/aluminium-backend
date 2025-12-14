/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SaleInvoiceService } from '../../services/sale-invoice/sale-invoice.service';
import { CreateSalesInvoiceDto } from '../../salesinvoice.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../auth/jwt-auth.guard';
import { PaginationDto } from '../../../../../common/dtos/pagination.dto';

@ApiTags('Sale-invoice')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sale-invoice')
export class SaleInvoiceController {
  constructor(private readonly saleInvoiceService: SaleInvoiceService) {}

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    return await this.saleInvoiceService.findAll(paginationDto);
  }

  @Get('/:invoiceNumber')
  async findByInvoiceNumber(@Param('invoiceNumber') invoiceNumber: string) {
    return await this.saleInvoiceService.findByInvoiceNumber(invoiceNumber);
  }

  @Post()
  async createInvoice(@Body() data: CreateSalesInvoiceDto) {
    return await this.saleInvoiceService.createInvoice(data);
  }

  @Put('/:invoiceNumber')
  async updateInvoice(
    @Param('invoiceNumber') invoiceNumber: string,
    @Body() data: CreateSalesInvoiceDto,
  ) {
    return await this.saleInvoiceService.updateInvoice(invoiceNumber, data);
  }

  @Delete('/:invoiceNumber')
  async deleteInvoice(@Param('invoiceNumber') invoiceNumber: string) {
    console.log('Deleting invoice:', invoiceNumber);
    return await this.saleInvoiceService.deleteInvoice(invoiceNumber);
  }
}
