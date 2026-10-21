/* eslint-disable prettier/prettier */
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { CreateSupplierDto } from '../supplier.dto';
import { SupplierService } from './../services/supplier.service';
import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
@ApiTags("supplier")
@Controller('suppliers')
export class SupplierController {


    constructor(private readonly supplierService: SupplierService) { }

    @Get()
    async findAll() {
        return await this.supplierService.findAll()
    }

    @Get('/:id')
    async findById(@Param('id') id: string) {

        return await this.supplierService.findById(id)
    }

    @Post()
    async newSupplier(@Body() data: CreateSupplierDto) {
        return await this.supplierService.create(data)
    }

    @Put('/:id')
    async putSupplier(@Param('id') id: string, @Body() data: Partial<CreateSupplierDto>) {
        return await this.supplierService.updateSupplier(id, data);
    }

    @ApiBody({ type: CreateSupplierDto })
    @Patch('updateSupplier/:id')
    async updateSupplier(@Param('id') id: string, @Body() data: Partial<CreateSupplierDto>) {
        return await this.supplierService.updateSupplier(id, data)
    }


    @Delete('/:id')
    async deleteSupplier(@Param('id') id: string) {
        return await this.supplierService.deleteSupplier(id)
    }



}
