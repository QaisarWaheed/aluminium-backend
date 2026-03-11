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
import { PurchaseorderService } from '../services/purchaseorder.service';

import { CreatePurchaseOrderDto } from '../dtos/CreatePurchaseOrder.dto';

@Controller('purchaseorder')
export class PurchaseorderController {
  constructor(private readonly purchaseOrderService: PurchaseorderService) {}

  @Get()
  async findAll() {
    return await this.purchaseOrderService.findAll();
  }

  // --- CRUD by poNumber ---

  @Get('/:poNumber')
  async findByPoNumber(@Param('poNumber') poNumber: string) {
    return await this.purchaseOrderService.findByPoNumber(poNumber);
  }

  @Post()
  async createInvoice(@Body() data: CreatePurchaseOrderDto) {
    return await this.purchaseOrderService.createInvoice(data);
  }

  @Put('/:poNumber')
  async updateByPoNumber(
    @Param('poNumber') poNumber: string,
    @Body() data: CreatePurchaseOrderDto,
  ) {
    return await this.purchaseOrderService.updatePurchaseOrder(poNumber, data);
  }

  @Delete('/:poNumber')
  async deleteByPoNumber(@Param('poNumber') poNumber: string) {
    return await this.purchaseOrderService.deleteInvoice(poNumber);
  }
}
