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

type SalesInvoiceCustomer = { name?: string } | Array<{ name?: string }> | null;

type SalesInvoiceLineItem = {
  sku?: string;
  quantity?: number;
  itemName?: string;
  thickness?: string;
  color?: string;
  productId?: string | Types.ObjectId;
  _id?: string | Types.ObjectId;
};

type AggregatedInvoiceLineItem = {
  variantId: string;
  quantity: number;
  itemName?: string;
  thickness?: string;
  color?: string;
};

type StockAdjustment = AggregatedInvoiceLineItem & {
  direction: 'IN' | 'OUT';
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
        thickness: item.thickness || current?.thickness,
        color: item.color || current?.color,
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
    item: Pick<AggregatedInvoiceLineItem, 'itemName' | 'thickness' | 'color'>,
  ): string {
    const productLabel = item.itemName || 'Variant';
    const attributes = [item.thickness, item.color].filter(Boolean).join(' / ');

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
