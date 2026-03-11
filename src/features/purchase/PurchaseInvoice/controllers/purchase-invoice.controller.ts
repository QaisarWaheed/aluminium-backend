/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PurchaseInvoiceService } from '../services/purchase-invoice.service';

import { ApiTags } from '@nestjs/swagger';
import { CreatePurchaseInvoiceDto } from '../dtos/CreatePurchaseInvoiceDto.dto';
import { Roles } from 'src/features/auth/roles.decorator';
import { Role } from 'src/features/user/enums/role.enum';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

@ApiTags('purchase-invoice')
@Controller('purchase-invoice')
export class PurchaseInvoiceController {
  constructor(
    private readonly purchaseInvoiceService: PurchaseInvoiceService,
  ) {}

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    return await this.purchaseInvoiceService.findAll(paginationDto);
  }

  @Get('/:purchaseInvoiceNumber')
  async findByNumber(
    @Param('purchaseInvoiceNumber') purchaseInvoiceNumber: string,
  ) {
    return await this.purchaseInvoiceService.findByInvoiceNumber(
      purchaseInvoiceNumber,
    );
  }

  @Post()
  @Roles(Role.ADMIN)
  async createInvoice(@Body() data: CreatePurchaseInvoiceDto) {
    return await this.purchaseInvoiceService.createInvoice(data);
  }

  @Put('/:purchaseInvoiceNumber')
  @Roles(Role.ADMIN)
  async updateInvoice(
    @Param('purchaseInvoiceNumber') purchaseInvoiceNumber: string,
    @Body() data: CreatePurchaseInvoiceDto,
  ) {
    return await this.purchaseInvoiceService.updateInvoice(
      purchaseInvoiceNumber,
      data,
    );
  }

  @Delete('/:purchaseInvoiceNumber')
  @Roles(Role.ADMIN)
  async deleteInvoice(
    @Param('purchaseInvoiceNumber') purchaseInvoiceNumber: string,
  ) {
    return await this.purchaseInvoiceService.deleteInvoice(
      purchaseInvoiceNumber,
    );
  }
}
