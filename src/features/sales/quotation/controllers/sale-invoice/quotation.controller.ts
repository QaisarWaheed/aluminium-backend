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
import { QuotationService } from '../../services/quotation-service/quotation.service';
import { CreateQuotationDto } from '../../createQuotation.dto';

@Controller('quotations')
export class QuotationController {
  constructor(private readonly quotationService: QuotationService) {}

  @Get()
  async findAll() {
    return await this.quotationService.findAll();
  }

  @Get('/:id')
  async findById(@Param('id') id: string) {
    return await this.quotationService.findById(id);
  }

  @Post()
  async createInvoice(@Body() data: CreateQuotationDto) {
    console.log('Creating quotation:', data);

    try {
      return await this.quotationService.createInvoice(data);
    } catch (error) {
      console.error('Error creating quotation:', error);
      throw error;
    }
  }

  @Put('/:id')
  async updateInvoice(
    @Param('id') id: string,
    @Body() data: CreateQuotationDto,
  ) {
    return await this.quotationService.updateInvoice(id, data);
  }

  @Delete('/:id')
  async deleteInvoice(@Param('id') id: string) {
    return await this.quotationService.deleteInvoice(id);
  }
}
