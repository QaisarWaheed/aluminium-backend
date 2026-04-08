import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../auth/jwt-auth.guard';
import { SaleInvoiceService } from '../../services/sale-invoice/sale-invoice.service';

@ApiTags('Sales Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesAnalyticsController {
  constructor(private readonly saleInvoiceService: SaleInvoiceService) {}

  @Get('analytics/profit-stats')
  async getProfitStats(@Query('days') days?: string) {
    const parsedDays = Number(days);
    const safeDays = Number.isFinite(parsedDays) ? parsedDays : 30;
    return await this.saleInvoiceService.getProfitStats(safeDays);
  }
}
