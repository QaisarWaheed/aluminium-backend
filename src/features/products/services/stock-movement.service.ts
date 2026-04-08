/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Product } from '../entities/Product.entity';
import {
  StockLedgerService,
  StockTransactionDto,
} from './stock-ledger.service';
import { StockTransactionType } from '../entities/StockLedger.entity';

export type StockMovementDirection = 'IN' | 'OUT';

export type AdjustStockOptions = {
  referenceId?: string;
  transactionType?: StockTransactionType;
  notes?: string;
  createdBy?: string;
  expectedBrand?: string;
  session?: ClientSession;
};

type VariantWithId = {
  _id?: Types.ObjectId;
  sku?: string;
  availableStock?: number;
  openingStock?: number;
  thickness?: string;
  color?: string;
  length?: string;
};

type ProductWithVariant = {
  product: Product;
  variant: VariantWithId;
  query: { 'variants._id': string } | { 'variants.sku': string };
};

type StockMovementResult = {
  productId: string;
  sku: string;
  brand?: string;
  length?: string;
  previousStock: number;
  newStock: number;
};

@Injectable()
export class StockMovementService {
  constructor(
    @InjectModel('Product')
    private readonly productModel: Model<Product>,
    private readonly stockLedgerService: StockLedgerService,
  ) {}

  async adjustStock(
    variantId: string,
    quantity: number,
    type: StockMovementDirection,
    options: AdjustStockOptions = {},
  ): Promise<StockMovementResult> {
    if (!variantId?.trim()) {
      throw new BadRequestException('variantId is required');
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('quantity must be greater than zero');
    }

    const variantContext = await this.findVariantByIdentifier(
      variantId,
      options.session,
    );
    const previousStock =
      variantContext.variant.availableStock ??
      variantContext.variant.openingStock ??
      0;
    const quantityChange = type === 'IN' ? quantity : -quantity;
    const newStock = previousStock + quantityChange;

    const expectedBrand = String(options.expectedBrand || '').trim();
    const resolvedBrand = String(variantContext.product.brand || '').trim();
    if (expectedBrand && resolvedBrand && expectedBrand !== resolvedBrand) {
      throw new BadRequestException(
        `Brand mismatch for variant ${variantContext.variant.sku ?? variantId}. Expected '${expectedBrand}' but product belongs to '${resolvedBrand}'.`,
      );
    }

    if (newStock < 0) {
      throw new BadRequestException(
        `Insufficient stock for variant ${variantContext.variant.sku ?? variantId}`,
      );
    }

    await this.productModel.updateOne(
      variantContext.query,
      { $set: { 'variants.$.availableStock': newStock } },
      options.session ? { session: options.session } : undefined,
    );

    const ledgerEntry: StockTransactionDto = {
      transactionType:
        options.transactionType ?? this.getDefaultTransactionType(type),
      referenceId: options.referenceId,
      productId: variantContext.product._id.toString(),
      sku: variantContext.variant.sku ?? variantId,
      brand: variantContext.product.brand,
      length: variantContext.variant.length,
      quantityChange,
      previousStock,
      notes: options.notes,
      createdBy: options.createdBy,
    };

    await this.stockLedgerService.createStockEntry(
      ledgerEntry,
      options.session,
    );

    return {
      productId: variantContext.product._id.toString(),
      sku: variantContext.variant.sku ?? variantId,
      brand: variantContext.product.brand,
      length: variantContext.variant.length,
      previousStock,
      newStock,
    };
  }

  private async findVariantByIdentifier(
    variantId: string,
    session?: ClientSession,
  ): Promise<ProductWithVariant> {
    const candidates: Array<Record<string, string>> = [
      { 'variants.sku': variantId },
    ];

    if (Types.ObjectId.isValid(variantId)) {
      candidates.unshift({ 'variants._id': variantId });
    }

    const query = { $or: candidates };
    const product = await this.productModel
      .findOne(query)
      .session(session ?? null)
      .exec();

    if (!product) {
      throw new NotFoundException(`Variant not found: ${variantId}`);
    }

    const variant = (product.variants || []).find((item) => {
      const itemId = item && '_id' in item ? String(item._id) : '';
      return item.sku === variantId || itemId === variantId;
    }) as VariantWithId | undefined;

    if (!variant) {
      throw new NotFoundException(`Variant not found: ${variantId}`);
    }

    const itemId = variant._id ? String(variant._id) : '';

    return {
      product,
      variant,
      query:
        itemId && itemId === variantId
          ? { 'variants._id': variantId }
          : { 'variants.sku': variant.sku ?? variantId },
    };
  }

  private getDefaultTransactionType(
    type: StockMovementDirection,
  ): StockTransactionType {
    return type === 'IN'
      ? StockTransactionType.PURCHASE
      : StockTransactionType.RETURN;
  }
}
