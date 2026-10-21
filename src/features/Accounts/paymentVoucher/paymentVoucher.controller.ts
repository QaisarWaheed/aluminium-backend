/* eslint-disable prettier/prettier */
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentVoucherService } from './paymentVoucher.service';
import { CreatePaymentVoucherDto } from './createPaymentVoucher.dto';

@ApiTags('payment-voucher')
@Controller('payment-voucher')
export class PaymentVoucherController {
    constructor(private readonly paymentVoucherService: PaymentVoucherService) { }

    @Get()
    async findAll() {
        return await this.paymentVoucherService.findAll();
    }

    @Get('/:voucherNumber')
    async findByVoucherNumber(@Param('voucherNumber') voucherNumber: string) {
        return await this.paymentVoucherService.findByVoucherNumber(voucherNumber);
    }

    @Post()
    async create(@Body() data: CreatePaymentVoucherDto) {
        return await this.paymentVoucherService.create(data);
    }

    @Put('/:voucherNumber')
    async update(
        @Param('voucherNumber') voucherNumber: string,
        @Body() data: CreatePaymentVoucherDto
    ) {
        return await this.paymentVoucherService.update(voucherNumber, data);
    }

    @Delete('/:voucherNumber')
    async delete(@Param('voucherNumber') voucherNumber: string) {
        return await this.paymentVoucherService.delete(voucherNumber);
    }
}