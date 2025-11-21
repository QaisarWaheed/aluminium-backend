/* eslint-disable prettier/prettier */
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';

import { PurchaseReturnService } from '../services/purchase-return.service';
import { CreatePurchaseReturnDto } from '../dtos/CreatePurchaseReturn.dto';

@Controller('purchase-returns')
export class PurchaseReturnController {



    constructor(private readonly purchaseReturnService: PurchaseReturnService) { }


    @Get()
    async findAll() {
        return await this.purchaseReturnService.findAll()
    }

    @Get('/next-number')
    async getNextNumber() {
        return await this.purchaseReturnService.getNextReturnNumber();
    }

    @Get('/:returnNumber')
    async findById(@Param('returnNumber') returnNumber: string) {
        return await this.purchaseReturnService.findById(returnNumber)
    }

    @Post()
    async createInvoice(@Body() data: CreatePurchaseReturnDto) {
        return await this.purchaseReturnService.createInvoice(data)
    }

    @Put('/:returnNumber')
    async updateInvoice(@Param('returnNumber') returnNumber: string, @Body() data: CreatePurchaseReturnDto) {
        return await this.purchaseReturnService.updateInvoice(returnNumber, data)
    }

    @Delete('/:returnNumber')
    async deleteInvoice(@Param('returnNumber') returnNumber: string) {
        return await this.purchaseReturnService.deleteInvoice(returnNumber)
    }

}
