/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';
import CreateCustomerDto from '../../dtos/createCustomer.dto';
import { CustomerService } from '../../services/customer/customer.service';

@ApiTags('Customers')
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) { }

  @Get()
  getAll() {
    return this.customerService.findAll();
  }

  @Get('/:id')
  getOne(@Param('id') id: string) {
    return this.customerService.findById(id);
  }

  @Post()
  create(@Body() data: CreateCustomerDto) {
    return this.customerService.addCustomer(data);
  }

  @Put('/:id')
  update(@Param('id') id: string, @Body() data: Partial<CreateCustomerDto>) {
    return this.customerService.updateCustomer(id, data);
  }

  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.customerService.deleteCustomer(id);
  }
}
