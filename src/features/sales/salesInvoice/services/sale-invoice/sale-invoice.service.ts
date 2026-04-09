/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SalesInvoice } from '../../salesinvoice.entity';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { CreateSalesInvoiceDto } from '../../salesinvoice.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from '../../../../../common/dtos/pagination.dto';
import { PaginatedResult } from '../../../../../common/interfaces/paginated-result.interface';
import { JournalvoucherService } from '../../../../Accounts/journalVoucher/services/journalvoucher/journalvoucher.service';
import { ProductService } from '../../../../products/services/product.service';
import {
  StockLedger,
  StockTransactionType,
} from '../../../../products/entities/StockLedger.entity';
import { Product } from '../../../../products/entities/Product.entity';
import { StockMovementService } from '../../../../products/services/stock-movement.service';
import { SessionService } from 'src/features/session/session.service';
import { DraftService } from '../../../draft/services/draft.service';

type SalesInvoiceCustomer = { name?: string } | Array<{ name?: string }> | null;

type SalesInvoiceLineItem = {
  sku?: string;
  quantity?: number;
  amount?: number;
  totalNetAmount?: number;
  salesRate?: number;
  purchasePrice?: number;
  costPrice?: number;
  itemName?: string;
  brand?: string;
  thickness?: string;
  color?: string;
  length?: string;
  productId?: string | Types.ObjectId;
  _id?: string | Types.ObjectId;
};

type AggregatedInvoiceLineItem = {
  variantId: string;
  quantity: number;
  itemName?: string;
  brand?: string;
  thickness?: string;
  color?: string;
  length?: string;
};

type StockAdjustment = AggregatedInvoiceLineItem & {
  direction: 'IN' | 'OUT';
};

type ProfitStatsPoint = {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
};

type ProfitStatsSummary = {
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
};

type ProfitStatsResponse = {
  periodDays: number;
  summary: ProfitStatsSummary;
  daily: ProfitStatsPoint[];
};

function getCustomerName(customer: SalesInvoiceCustomer): string {
  if (Array.isArray(customer)) {
    return customer[0]?.name ?? 'Unknown';
  }
  return customer?.name ?? 'Unknown';
}

function normalizeId(value?: string | Types.ObjectId): string | null {
  if (!value) {
    return null;
  }

  return typeof value === 'string' ? value : value.toString();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function toDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Injectable()
export class SaleInvoiceService {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    @InjectModel('SalesInvoice')
    private readonly saleInvoiceModel: Model<SalesInvoice>,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    @InjectModel(StockLedger.name)
    private readonly stockLedgerModel: Model<StockLedger>,
    private readonly journalVoucherService: JournalvoucherService,
    private readonly productService: ProductService,
    private readonly stockMovementService: StockMovementService,
    private readonly sessionService: SessionService,
    private readonly draftService: DraftService,
  ) {}

  async findAll(
    paginationDto: PaginationDto = { page: 1, limit: 10 },
  ): Promise<PaginatedResult<SalesInvoice>> {
    const { page = 1, limit = 10, search } = paginationDto;
    const skip = (page - 1) * limit;
    const trimmedSearch = search?.trim();
    const query = trimmedSearch
      ? {
          $or: [
            {
              invoiceNumber: {
                $regex: escapeRegex(trimmedSearch),
                $options: 'i',
              },
            },
            { remarks: { $regex: escapeRegex(trimmedSearch), $options: 'i' } },
            {
              'customer.name': {
                $regex: escapeRegex(trimmedSearch),
                $options: 'i',
              },
            },
            {
              'items.itemName': {
                $regex: escapeRegex(trimmedSearch),
                $options: 'i',
              },
            },
            {
              'items.productName': {
                $regex: escapeRegex(trimmedSearch),
                $options: 'i',
              },
            },
            {
              'items.sku': {
                $regex: escapeRegex(trimmedSearch),
                $options: 'i',
              },
            },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.saleInvoiceModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.saleInvoiceModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      lastPage: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findByInvoiceNumber(
    invoiceNumber: string,
  ): Promise<SalesInvoice | null> {
    return await this.saleInvoiceModel.findOne({ invoiceNumber }).exec();
  }

  async createInvoice(
    data: CreateSalesInvoiceDto,
    userId: string,
    allowNegativeStock = false,
  ): Promise<SalesInvoice> {
    if (!data.totalNetAmount || data.totalNetAmount <= 0) {
      throw new BadRequestException('Invoice total must be greater than zero.');
    }

    const openSession =
      await this.sessionService.findOpenSessionForUser(userId);

    if (!openSession) {
      throw new ForbiddenException('Please open a shift first');
    }

    const session = await this.connection.startSession();

    try {
      let invoice: SalesInvoice | null = null;

      await session.withTransaction(async () => {
        // Abort before invoice creation if stock is not available.
        if (data.items && data.items.length > 0) {
          for (const rawItem of data.items) {
            const item = rawItem as unknown as SalesInvoiceLineItem;
            if (!item.sku || !item.quantity) continue;

            const quantityToDeduct = Number(item.quantity);

            // Fetch current state inside transaction locking
            const currentProduct = await this.productModel
              .findOne({ 'variants.sku': item.sku })
              .session(session)
              .exec();

            if (!currentProduct) {
              throw new NotFoundException(
                `Product containing SKU ${item.sku} not found`,
              );
            }

            const expectedBrand = String(item.brand || '').trim();
            const actualBrand = String(currentProduct.brand || '').trim();
            if (expectedBrand && actualBrand && expectedBrand !== actualBrand) {
              throw new BadRequestException(
                `Brand mismatch for ${item.itemName || item.sku}. Expected '${expectedBrand}' but product belongs to '${actualBrand}'.`,
              );
            }

            const variant = currentProduct.variants.find(
              (v) => v.sku === item.sku,
            );
            if (
              !allowNegativeStock &&
              (variant?.availableStock || 0) < quantityToDeduct
            ) {
              throw new BadRequestException(
                `Insufficient stock for ${item.itemName} (${item.thickness} - ${item.color}). Available: ${variant?.availableStock || 0}, Required: ${quantityToDeduct}`,
              );
            }

            // ATOMIC DEDUCTION
            const updatedProduct = await this.productModel
              .findOneAndUpdate(
                { 'variants.sku': item.sku },
                { $inc: { 'variants.$.availableStock': -quantityToDeduct } },
                { new: true, session },
              )
              .exec();

            if (!updatedProduct) {
              throw new InternalServerErrorException(
                `Failed to update stock for SKU ${item.sku}`,
              );
            }

            const updatedVariant = updatedProduct.variants.find(
              (v) => v.sku === item.sku,
            );

            // Create Stock Ledger Entry
            const ledgerEntry = new this.stockLedgerModel({
              productId: currentProduct._id,
              sku: item.sku,
              brand: currentProduct.brand,
              quantityChange: -quantityToDeduct,
              transactionType: StockTransactionType.SALE,
              referenceId: data.invoiceNumber,
              previousStock: variant?.availableStock || 0,
              newStock: updatedVariant?.availableStock || 0,
              notes: `Sale posted - ${data.invoiceNumber} - ${item.itemName || 'Variant'}`,
              createdBy: userId,
            });

            await ledgerEntry.save({ session });
          }
        }

        const invoicePayload = {
          ...data,
          totalDiscount: data.totalDiscountAmount || 0,
          sessionId: openSession._id.toString(),
        };

        const createdInvoice = await this.saleInvoiceModel.create(
          [invoicePayload],
          {
            session,
          },
        );
        invoice = createdInvoice[0];

        const customerName = getCustomerName(
          data.customer as SalesInvoiceCustomer,
        );
        const invoiceAmount = Number(
          data.totalNetAmount || data.amount || data.subTotal || 0,
        );

        if (invoiceAmount > 0) {
          await this.journalVoucherService.createDoubleEntry(
            {
              voucherNumber: data.invoiceNumber,
              referenceId: data.invoiceNumber,
              transactionDate: data.invoiceDate || new Date(),
              description: `Sale Invoice Posted - ${data.invoiceNumber}`,
              debitEntry: {
                accountNumber:
                  data.receivedAmount &&
                  Number(data.receivedAmount) >= invoiceAmount
                    ? 'Cash'
                    : `Accounts Receivable - ${customerName}`,
                amount: invoiceAmount,
              },
              creditEntry: {
                accountNumber: 'Sales Revenue',
                amount: invoiceAmount,
              },
            },
            session,
          );
        }
      });

      if (!invoice) {
        throw new InternalServerErrorException(
          'Invoice transaction completed without returning an invoice',
        );
      }

      // Cleanup associated draft automatically upon final save
      try {
        await this.draftService.deleteByKey('sales-draft:Invoice', userId);
      } catch (err) {
        console.warn('Failed to cleanup draft after invoice creation:', err);
      }

      return invoice;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      const errorLabels =
        typeof error === 'object' && error !== null && 'errorLabels' in error
          ? (error as { errorLabels?: string[] }).errorLabels
          : undefined;

      console.error('Error creating invoice within transaction:', error);

      if (errorLabels?.includes('TransientTransactionError')) {
        throw new ServiceUnavailableException(
          'Invoice transaction failed and was rolled back. Please retry.',
        );
      }

      throw new InternalServerErrorException(
        'Invoice transaction failed and all changes were rolled back.',
      );
    } finally {
      await session.endSession();
    }
  }

  async updateInvoice(
    invoiceNumber: string,
    data: CreateSalesInvoiceDto,
  ): Promise<SalesInvoice | null> {
    const session = await this.connection.startSession();

    try {
      let updatedInvoice: SalesInvoice | null = null;

      await session.withTransaction(async () => {
        const existingInvoice = await this.saleInvoiceModel
          .findOne({ invoiceNumber })
          .session(session)
          .exec();

        if (!existingInvoice) {
          throw new NotFoundException('Invoice not found');
        }

        const adjustments = this.calculateStockAdjustments(
          (existingInvoice.items || []) as SalesInvoiceLineItem[],
          data.items || [],
        );

        await this.applyStockAdjustments(
          invoiceNumber,
          adjustments,
          StockTransactionType.MANUAL_ADJUSTMENT,
          session,
          'Invoice updated',
        );

        const invoicePayload = {
          ...data,
          totalDiscount: data.totalDiscountAmount || 0,
        };

        updatedInvoice = await this.saleInvoiceModel
          .findOneAndUpdate({ invoiceNumber }, invoicePayload, {
            new: true,
            session,
          })
          .exec();

        const customerName = getCustomerName(
          data.customer as SalesInvoiceCustomer,
        );
        const invoiceAmount = Number(
          data.totalNetAmount || data.amount || data.subTotal || 0,
        );

        await this.journalVoucherService.deleteByReferenceId(
          invoiceNumber,
          session,
        );

        if (invoiceAmount > 0) {
          await this.journalVoucherService.createDoubleEntry(
            {
              voucherNumber: invoiceNumber,
              referenceId: invoiceNumber,
              transactionDate: data.invoiceDate || new Date(),
              description: `Sale Invoice Updated - ${invoiceNumber}`,
              debitEntry: {
                accountNumber:
                  data.receivedAmount &&
                  Number(data.receivedAmount) >= invoiceAmount
                    ? 'Cash'
                    : `Accounts Receivable - ${customerName}`,
                amount: invoiceAmount,
              },
              creditEntry: {
                accountNumber: 'Sales Revenue',
                amount: invoiceAmount,
              },
            },
            session,
          );
        }
      });

      return updatedInvoice;
    } catch (error) {
      this.rethrowTransactionError(error, 'Could not update invoice');
    } finally {
      await session.endSession();
    }
  }
  async deleteInvoice(invoiceNumber: string) {
    const session = await this.connection.startSession();

    try {
      let deletedInvoice: SalesInvoice | null = null;

      await session.withTransaction(async () => {
        const existingInvoice = await this.saleInvoiceModel
          .findOne({ invoiceNumber })
          .session(session)
          .exec();

        if (!existingInvoice) {
          throw new NotFoundException('Invoice not found');
        }

        await this.reverseStockDeduction(
          invoiceNumber,
          (existingInvoice.items || []) as SalesInvoiceLineItem[],
          session,
        );

        await this.journalVoucherService.deleteByReferenceId(
          invoiceNumber,
          session,
        );

        deletedInvoice = await this.saleInvoiceModel
          .findOneAndDelete({ invoiceNumber }, { session })
          .exec();
      });

      return deletedInvoice;
    } catch (error) {
      this.rethrowTransactionError(error, 'Could not delete invoice');
    } finally {
      await session.endSession();
    }
  }

  async getProfitStats(days = 30): Promise<ProfitStatsResponse> {
    const safeDays = Math.min(Math.max(Math.trunc(days || 30), 1), 365);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (safeDays - 1));

    const invoices = await this.saleInvoiceModel
      .find({
        invoiceDate: { $gte: startDate, $lte: endDate },
      })
      .select('invoiceDate totalNetAmount amount subTotal items')
      .lean()
      .exec();

    const skuSet = new Set<string>();
    for (const invoice of invoices) {
      const items = Array.isArray(invoice.items)
        ? (invoice.items as SalesInvoiceLineItem[])
        : [];
      for (const item of items) {
        if (item.sku) {
          skuSet.add(String(item.sku));
        }
      }
    }

    const products =
      skuSet.size > 0
        ? await this.productModel
            .find({ 'variants.sku': { $in: Array.from(skuSet) } })
            .select('variants.sku variants.purchasePrice variants.salesRate')
            .lean()
            .exec()
        : [];

    const skuCostMap = new Map<string, number>();
    for (const product of products) {
      const variants = Array.isArray(product.variants)
        ? (product.variants as Array<{
            sku?: string;
            purchasePrice?: number;
            salesRate?: number;
          }>)
        : [];

      for (const variant of variants) {
        if (!variant.sku) {
          continue;
        }
        const unitCost = Math.max(
          0,
          toNumber(variant.purchasePrice) || toNumber(variant.salesRate),
        );
        skuCostMap.set(String(variant.sku), unitCost);
      }
    }

    const dailyMap = new Map<string, { revenue: number; cost: number }>();
    const rollingDate = new Date(startDate);
    while (rollingDate <= endDate) {
      dailyMap.set(toDateKey(rollingDate), { revenue: 0, cost: 0 });
      rollingDate.setDate(rollingDate.getDate() + 1);
    }

    for (const invoice of invoices) {
      const invoiceDate = new Date(invoice.invoiceDate || new Date());
      if (Number.isNaN(invoiceDate.getTime())) {
        continue;
      }
      const dateKey = toDateKey(invoiceDate);
      const bucket = dailyMap.get(dateKey);
      if (!bucket) {
        continue;
      }

      const revenue =
        toNumber(invoice.totalNetAmount) ||
        toNumber(invoice.amount) ||
        toNumber(invoice.subTotal);

      const items = Array.isArray(invoice.items)
        ? (invoice.items as SalesInvoiceLineItem[])
        : [];

      const lineItemCost = items.reduce((sum, item) => {
        const quantity = Math.max(0, toNumber(item.quantity));
        if (quantity <= 0) {
          return sum;
        }

        const inlineCost =
          toNumber(item.purchasePrice) || toNumber(item.costPrice);
        const mappedCost = item.sku ? toNumber(skuCostMap.get(item.sku)) : 0;
        const unitCost = Math.max(0, inlineCost || mappedCost);

        return sum + unitCost * quantity;
      }, 0);

      bucket.revenue += revenue;
      bucket.cost += lineItemCost;
    }

    const daily = Array.from(dailyMap.entries()).map(([date, totals]) => {
      const revenue = round2(totals.revenue);
      const cost = round2(totals.cost);
      const profit = round2(revenue - cost);
      const marginPercent = revenue > 0 ? round2((profit / revenue) * 100) : 0;

      return {
        date,
        revenue,
        cost,
        profit,
        marginPercent,
      };
    });

    const summary = daily.reduce<ProfitStatsSummary>(
      (acc, day) => {
        acc.revenue += day.revenue;
        acc.cost += day.cost;
        acc.profit += day.profit;
        return acc;
      },
      { revenue: 0, cost: 0, profit: 0, marginPercent: 0 },
    );

    summary.revenue = round2(summary.revenue);
    summary.cost = round2(summary.cost);
    summary.profit = round2(summary.profit);
    summary.marginPercent =
      summary.revenue > 0
        ? round2((summary.profit / summary.revenue) * 100)
        : 0;

    return {
      periodDays: safeDays,
      summary,
      daily,
    };
  }

  /**
   * Validate stock availability for all line items
   */
  private async validateStockAvailability(
    items: SalesInvoiceLineItem[],
    allowNegativeStock = false,
    session?: ClientSession,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const item of items) {
      // Skip validation if no SKU (legacy products)
      if (!item.sku) continue;

      const currentStock = await this.productService.getVariantStock(
        item.sku,
        session,
      );
      const requiredQuantity = item.quantity || 0;

      if (!allowNegativeStock && currentStock < requiredQuantity) {
        const productInfo = `${item.itemName} (${item.thickness} - ${item.color})`;
        errors.push(
          `Insufficient stock for ${productInfo}. Available: ${currentStock}, Required: ${requiredQuantity}`,
        );
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Process stock deduction for sale items
   */
  private async processStockDeduction(
    invoiceNumber: string,
    items: SalesInvoiceLineItem[],
    session?: ClientSession,
  ): Promise<void> {
    const movements = Array.from(
      this.aggregateInvoiceItems(items).values(),
    ).map((item) => ({ ...item, direction: 'OUT' as const }));

    await this.applyStockAdjustments(
      invoiceNumber,
      movements,
      StockTransactionType.SALE,
      session,
      'Sale posted',
    );
  }

  private async reverseStockDeduction(
    invoiceNumber: string,
    items: SalesInvoiceLineItem[],
    session?: ClientSession,
  ): Promise<void> {
    const movements = Array.from(
      this.aggregateInvoiceItems(items).values(),
    ).map((item) => ({ ...item, direction: 'IN' as const }));

    await this.applyStockAdjustments(
      invoiceNumber,
      movements,
      StockTransactionType.CANCELLED,
      session,
      'Invoice cancelled',
    );
  }

  private aggregateInvoiceItems(
    items: SalesInvoiceLineItem[],
  ): Map<string, AggregatedInvoiceLineItem> {
    const aggregated = new Map<string, AggregatedInvoiceLineItem>();

    for (const item of items) {
      const variantId = this.resolveVariantIdentifier(item);
      const quantity = Number(item.quantity || 0);

      if (!variantId || quantity <= 0) {
        continue;
      }

      const current = aggregated.get(variantId);
      aggregated.set(variantId, {
        variantId,
        quantity: (current?.quantity || 0) + quantity,
        itemName: item.itemName || current?.itemName,
        brand: item.brand || current?.brand,
        thickness: item.thickness || current?.thickness,
        color: item.color || current?.color,
        length: item.length || current?.length,
      });
    }

    return aggregated;
  }

  private calculateStockAdjustments(
    previousItems: SalesInvoiceLineItem[],
    nextItems: SalesInvoiceLineItem[],
  ): StockAdjustment[] {
    const previousMap = this.aggregateInvoiceItems(previousItems);
    const nextMap = this.aggregateInvoiceItems(nextItems);
    const identifiers = new Set([...previousMap.keys(), ...nextMap.keys()]);
    const adjustments: StockAdjustment[] = [];

    for (const variantId of identifiers) {
      const previous = previousMap.get(variantId);
      const next = nextMap.get(variantId);
      const quantityDelta = (next?.quantity || 0) - (previous?.quantity || 0);

      if (quantityDelta === 0) {
        continue;
      }

      adjustments.push({
        variantId,
        quantity: Math.abs(quantityDelta),
        direction: quantityDelta > 0 ? 'OUT' : 'IN',
        itemName: next?.itemName || previous?.itemName,
        brand: next?.brand || previous?.brand,
        thickness: next?.thickness || previous?.thickness,
        color: next?.color || previous?.color,
      });
    }

    return adjustments;
  }

  private async applyStockAdjustments(
    invoiceNumber: string,
    adjustments: StockAdjustment[],
    transactionType: StockTransactionType,
    session: ClientSession | undefined,
    actionLabel: string,
  ): Promise<void> {
    for (const adjustment of adjustments) {
      await this.stockMovementService.adjustStock(
        adjustment.variantId,
        adjustment.quantity,
        adjustment.direction,
        {
          session,
          referenceId: invoiceNumber,
          transactionType,
          expectedBrand: adjustment.brand,
          notes: this.buildStockMovementNote(
            actionLabel,
            invoiceNumber,
            adjustment,
          ),
        },
      );
    }
  }

  private resolveVariantIdentifier(item: SalesInvoiceLineItem): string | null {
    return item.sku ?? normalizeId(item._id);
  }

  private buildStockMovementNote(
    actionLabel: string,
    invoiceNumber: string,
    item: Pick<
      AggregatedInvoiceLineItem,
      'itemName' | 'thickness' | 'color' | 'length'
    >,
  ): string {
    const productLabel = item.itemName || 'Variant';
    const attributes = [item.thickness, item.color, item.length]
      .filter(Boolean)
      .join(' / ');

    return attributes
      ? `${actionLabel} - ${invoiceNumber} - ${productLabel} (${attributes})`
      : `${actionLabel} - ${invoiceNumber} - ${productLabel}`;
  }

  private rethrowTransactionError(
    error: unknown,
    fallbackMessage: string,
  ): never {
    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }

    const errorLabels =
      typeof error === 'object' && error !== null && 'errorLabels' in error
        ? (error as { errorLabels?: string[] }).errorLabels
        : undefined;

    console.error(fallbackMessage, error);

    if (errorLabels?.includes('TransientTransactionError')) {
      throw new ServiceUnavailableException(
        'Invoice transaction failed and was rolled back. Please retry.',
      );
    }

    throw new InternalServerErrorException(
      `${fallbackMessage}. All changes were rolled back.`,
    );
  }
}
