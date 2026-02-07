/* eslint-disable prettier/prettier */
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { PurchaseInvoiceService } from '../services/purchase-invoice.service';

import { ApiTags } from '@nestjs/swagger';
import { CreatePurchaseInvoiceDto } from '../dtos/CreatePurchaseInvoiceDto.dto';

@ApiTags('purchase-invoice')
@Controller('purchase-invoice')
export class PurchaseInvoiceController {

    constructor(private readonly purchaseInvoiceService: PurchaseInvoiceService) { }

    @Get()
    async findAll() {
        return await this.purchaseInvoiceService.findAll();
    }

    @Get('/:purchaseInvoiceNumber')
    async findByNumber(@Param('purchaseInvoiceNumber') purchaseInvoiceNumber: string) {
        return await this.purchaseInvoiceService.findByInvoiceNumber(purchaseInvoiceNumber);
    }

    @Post()
    async createInvoice(@Body() data: CreatePurchaseInvoiceDto) {
        return await this.purchaseInvoiceService.createInvoice(data);
    }

    @Put('/:purchaseInvoiceNumber')
    async updateInvoice(
        @Param('purchaseInvoiceNumber') purchaseInvoiceNumber: string,
        @Body() data: CreatePurchaseInvoiceDto
    ) {
        return await this.purchaseInvoiceService.updateInvoice(purchaseInvoiceNumber, data);
    }

    @Delete('/:purchaseInvoiceNumber')
    async deleteInvoice(@Param('purchaseInvoiceNumber') purchaseInvoiceNumber: string) {
        return await this.purchaseInvoiceService.deleteInvoice(purchaseInvoiceNumber);
    }
}
