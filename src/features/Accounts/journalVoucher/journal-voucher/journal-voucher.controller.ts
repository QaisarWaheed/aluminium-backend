import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { JournalvoucherService } from '../services/journalvoucher/journalvoucher.service';
import { CreateJournalVoucherDto } from '../dtos/create-journal-voucher/create-journal-voucher.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Journal Voucher')
@Controller('journal-voucher')
export class JournalVoucherController {
  constructor(private readonly journalVoucherService: JournalvoucherService) {}

  @Post()
  async create(@Body() dto: CreateJournalVoucherDto) {
    return await this.journalVoucherService.create(dto);
  }

  @Get()
  async findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: { startDate?: string; endDate?: string } = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    return await this.journalVoucherService.findAll(
      Object.keys(filters).length ? filters : undefined,
    );
  }

  @Get(':voucherNumber')
  async findByVoucherNumber(@Param('voucherNumber') voucherNumber: string) {
    return await this.journalVoucherService.findByVoucherNumber(voucherNumber);
  }
}
