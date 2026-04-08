/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import {
  StockLedger,
  StockTransactionType,
} from '../entities/StockLedger.entity';

export interface StockTransactionDto {
  transactionType: StockTransactionType;
  referenceId?: string;
  productId: string;
  sku: string;
  brand?: string;
  length?: string;
  quantityChange: number;
  previousStock: number;
  notes?: string;
  createdBy?: string;
}

type StockSummaryResult = {
  totalInward: number;
  totalOutward: number;
  netMovement: number;
};

@Injectable()
export class StockLedgerService {
  constructor(
    @InjectModel(StockLedger.name)
    private stockLedgerModel: Model<StockLedger>,
  ) {}

  /**
   * Create a stock ledger entry
   */
  async createStockEntry(
    dto: StockTransactionDto,
    session?: ClientSession,
  ): Promise<StockLedger> {
    const newStock = dto.previousStock + dto.quantityChange;

    const stockEntry = new this.stockLedgerModel({
      ...dto,
      newStock,
    });

    return stockEntry.save(session ? { session } : undefined);
  }

  /**
   * Get stock history for a specific SKU
   */
  async getStockHistory(sku: string, limit = 100): Promise<StockLedger[]> {
    return this.stockLedgerModel
      .find({ sku })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get stock history for a product (all variants)
   */
  async getProductStockHistory(
    productId: string,
    limit = 100,
  ): Promise<StockLedger[]> {
    return this.stockLedgerModel
      .find({ productId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get current stock level from ledger (most recent entry)
   */
  async getCurrentStockFromLedger(sku: string): Promise<number> {
    const latestEntry = await this.stockLedgerModel
      .findOne({ sku })
      .sort({ createdAt: -1 })
      .exec();

    return latestEntry?.newStock || 0;
  }

  /**
   * Get stock movements for a specific transaction
   */
  async getTransactionMovements(referenceId: string): Promise<StockLedger[]> {
    return this.stockLedgerModel
      .find({ referenceId })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Create bulk stock entries (for sales with multiple line items)
   */
  async createBulkStockEntries(
    entries: StockTransactionDto[],
    session?: ClientSession,
  ): Promise<StockLedger[]> {
    const stockEntries = entries.map((dto) => ({
      ...dto,
      newStock: dto.previousStock + dto.quantityChange,
    }));

    if (session) {
      return this.stockLedgerModel.insertMany(stockEntries, {
        session,
      }) as unknown as Promise<StockLedger[]>;
    }

    return this.stockLedgerModel.insertMany(stockEntries) as unknown as Promise<
      StockLedger[]
    >;
  }

  /**
   * Get stock summary by transaction type
   */
  async getStockSummaryByType(
    sku: string,
    transactionType?: StockTransactionType,
  ): Promise<StockSummaryResult> {
    const matchQuery: { sku: string; transactionType?: StockTransactionType } =
      { sku };
    if (transactionType) {
      matchQuery.transactionType = transactionType;
    }

    const summary = await this.stockLedgerModel.aggregate<StockSummaryResult>([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalInward: {
            $sum: {
              $cond: [{ $gt: ['$quantityChange', 0] }, '$quantityChange', 0],
            },
          },
          totalOutward: {
            $sum: {
              $cond: [
                { $lt: ['$quantityChange', 0] },
                { $abs: '$quantityChange' },
                0,
              ],
            },
          },
          netMovement: { $sum: '$quantityChange' },
        },
      },
    ]);

    return summary[0] ?? { totalInward: 0, totalOutward: 0, netMovement: 0 };
  }

  /**
   * Validate stock availability before deduction
   */
  async validateStockAvailability(
    sku: string,
    requiredQuantity: number,
    allowNegativeStock = false,
  ): Promise<{ isAvailable: boolean; currentStock: number; shortage: number }> {
    const currentStock = await this.getCurrentStockFromLedger(sku);
    const shortage = Math.max(0, requiredQuantity - currentStock);

    return {
      isAvailable: allowNegativeStock || currentStock >= requiredQuantity,
      currentStock,
      shortage,
    };
  }
}
