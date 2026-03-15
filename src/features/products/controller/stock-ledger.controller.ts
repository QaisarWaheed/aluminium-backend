/* eslint-disable prettier/prettier */
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { StockLedgerService } from '../services/stock-ledger.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { StockTransactionType } from '../entities/StockLedger.entity';

@ApiTags('Stock Ledger')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stock-ledger')
export class StockLedgerController {
  constructor(private readonly stockLedgerService: StockLedgerService) {}

  @Get('history/:sku')
  @ApiOperation({ summary: 'Get stock history for a specific SKU' })
  @ApiParam({ name: 'sku', description: 'Product variant SKU' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of records to return',
  })
  async getStockHistoryBySku(
    @Param('sku') sku: string,
    @Query('limit') limit?: number,
  ) {
    return this.stockLedgerService.getStockHistory(sku, limit || 100);
  }

  @Get('product-history/:productId')
  @ApiOperation({ summary: 'Get stock history for all variants of a product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of records to return',
  })
  async getProductStockHistory(
    @Param('productId') productId: string,
    @Query('limit') limit?: number,
  ) {
    return this.stockLedgerService.getProductStockHistory(
      productId,
      limit || 100,
    );
  }

  @Get('current-stock/:sku')
  @ApiOperation({ summary: 'Get current stock level from ledger' })
  @ApiParam({ name: 'sku', description: 'Product variant SKU' })
  async getCurrentStock(@Param('sku') sku: string) {
    const currentStock =
      await this.stockLedgerService.getCurrentStockFromLedger(sku);
    return { sku, currentStock };
  }

  @Get('transaction/:referenceId')
  @ApiOperation({
    summary: 'Get all stock movements for a transaction (invoice, PO, etc.)',
  })
  @ApiParam({
    name: 'referenceId',
    description: 'Transaction reference ID (invoice number, PO number, etc.)',
  })
  async getTransactionMovements(@Param('referenceId') referenceId: string) {
    return this.stockLedgerService.getTransactionMovements(referenceId);
  }

  @Get('summary/:sku')
  @ApiOperation({ summary: 'Get stock movement summary for a SKU' })
  @ApiParam({ name: 'sku', description: 'Product variant SKU' })
  @ApiQuery({
    name: 'transactionType',
    required: false,
    enum: StockTransactionType,
    description: 'Filter by transaction type',
  })
  async getStockSummary(
    @Param('sku') sku: string,
    @Query('transactionType') transactionType?: StockTransactionType,
  ) {
    return this.stockLedgerService.getStockSummaryByType(sku, transactionType);
  }

  @Get('validate-availability/:sku/:quantity')
  @ApiOperation({ summary: 'Validate stock availability for a quantity' })
  @ApiParam({ name: 'sku', description: 'Product variant SKU' })
  @ApiParam({ name: 'quantity', description: 'Required quantity' })
  @ApiQuery({
    name: 'allowNegative',
    required: false,
    type: 'boolean',
    description: 'Allow negative stock',
  })
  async validateStockAvailability(
    @Param('sku') sku: string,
    @Param('quantity') quantity: number,
    @Query('allowNegative') allowNegative?: string,
  ) {
    return this.stockLedgerService.validateStockAvailability(
      sku,
      Number(quantity),
      allowNegative === 'true',
    );
  }
}
