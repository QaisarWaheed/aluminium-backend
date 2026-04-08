/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PurchaseInvoice } from '../entities/PurchaseInvoice.entity';
import { ClientSession, Connection, Model } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CreatePurchaseInvoiceDto } from '../dtos/CreatePurchaseInvoiceDto.dto';
import { PaginationDto } from '../../../../common/dtos/pagination.dto';
import { PaginatedResult } from '../../../../common/interfaces/paginated-result.interface';
import { JournalvoucherService } from 'src/features/Accounts/journalVoucher/services/journalvoucher/journalvoucher.service';
import {
  StockLedger,
  StockTransactionType,
} from 'src/features/products/entities/StockLedger.entity';
import { Product } from 'src/features/products/entities/Product.entity';

type PurchaseInvoiceLineItem = {
  sku?: string;
  variantId?: string;
  inventoryId?: string;
  id?: string;
  _id?: string;
  quantity?: number;
  productName?: string;
  itemName?: string;
  brand?: string;
  thickness?: string;
  color?: string;
  length?: string;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class PurchaseInvoiceService {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    @InjectModel('PurchaseInvoice')
    private readonly purchaseInvoiceModel: Model<PurchaseInvoice>,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    @InjectModel(StockLedger.name)
    private readonly stockLedgerModel: Model<StockLedger>,
    private readonly journalVoucherService: JournalvoucherService,
  ) {}

  async findAll(
    paginationDto: PaginationDto = { page: 1, limit: 10 },
  ): Promise<PaginatedResult<PurchaseInvoice>> {
    const { page = 1, limit = 10, search } = paginationDto;
    const skip = (page - 1) * limit;
    const trimmedSearch = search?.trim();
    const query = trimmedSearch
      ? {
          $or: [
            {
              purchaseInvoiceNumber: {
                $regex: escapeRegex(trimmedSearch),
                $options: 'i',
              },
            },
            { remarks: { $regex: escapeRegex(trimmedSearch), $options: 'i' } },
            {
              'supplier.name': {
                $regex: escapeRegex(trimmedSearch),
                $options: 'i',
              },
            },
            {
              'products.itemName': {
                $regex: escapeRegex(trimmedSearch),
                $options: 'i',
              },
            },
            {
              'products.productName': {
                $regex: escapeRegex(trimmedSearch),
                $options: 'i',
              },
            },
            {
              'products.sku': {
                $regex: escapeRegex(trimmedSearch),
                $options: 'i',
              },
            },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.purchaseInvoiceModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.purchaseInvoiceModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      lastPage: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findByInvoiceNumber(
    purchaseInvoiceNumber: string,
  ): Promise<PurchaseInvoice | null> {
    return await this.purchaseInvoiceModel.findOne({ purchaseInvoiceNumber });
  }

  async createInvoice(
    data: CreatePurchaseInvoiceDto,
  ): Promise<PurchaseInvoice> {
    const session = await this.connection.startSession();

    try {
      let createdInvoice: PurchaseInvoice | null = null;

      await session.withTransaction(async () => {
        const items: PurchaseInvoiceLineItem[] = Array.isArray(data.products)
          ? data.products.map(
              (item) => item as unknown as PurchaseInvoiceLineItem,
            )
          : [];
        this.validateStockMovements(items);

        const [invoice] = await this.purchaseInvoiceModel.create([data], {
          session,
        });
        createdInvoice = invoice;

        for (const item of items) {
          const variantId = this.getVariantIdentifier(item);
          const quantity = Number(item.quantity || 0);

          // Read current stock snapshot before atomic increment.
          const currentProduct = await this.productModel
            .findOne({
              $or: [
                { 'variants.sku': variantId },
                { 'variants._id': variantId },
              ],
            })
            .session(session)
            .exec();

          if (!currentProduct) {
            throw new BadRequestException(
              `Product variant not found for ${item.productName || item.itemName || variantId}`,
            );
          }

          const expectedBrand = String(item.brand || '').trim();
          const actualBrand = String(currentProduct.brand || '').trim();
          if (expectedBrand && actualBrand && expectedBrand !== actualBrand) {
            throw new BadRequestException(
              `Brand mismatch for ${item.productName || item.itemName || variantId}. Expected '${expectedBrand}' but product belongs to '${actualBrand}'.`,
            );
          }

          const previousVariant = currentProduct.variants.find(
            (variant) =>
              variant.sku === variantId ||
              String((variant as { _id?: unknown })._id) === variantId,
          );

          if (!previousVariant) {
            throw new BadRequestException(
              `Variant not found for ${item.productName || item.itemName || variantId}`,
            );
          }

          // Atomic stock increment to prevent race conditions under high throughput.
          const updatedProduct = await this.productModel
            .findOneAndUpdate(
              {
                $or: [
                  { 'variants.sku': variantId },
                  { 'variants._id': variantId },
                ],
              },
              { $inc: { 'variants.$.availableStock': quantity } },
              { new: true, session },
            )
            .exec();

          if (!updatedProduct) {
            throw new InternalServerErrorException(
              `Failed to update stock for ${item.productName || item.itemName || variantId}`,
            );
          }

          const updatedVariant = updatedProduct.variants.find(
            (variant) =>
              variant.sku === variantId ||
              String((variant as { _id?: unknown })._id) === variantId,
          );

          if (!updatedVariant) {
            throw new InternalServerErrorException(
              `Failed to resolve updated stock for ${item.productName || item.itemName || variantId}`,
            );
          }

          await this.stockLedgerModel.create(
            [
              {
                productId: currentProduct._id,
                sku: previousVariant.sku,
                brand: currentProduct.brand,
                length: previousVariant.length,
                quantityChange: quantity,
                transactionType: StockTransactionType.PURCHASE,
                referenceId: data.purchaseInvoiceNumber,
                previousStock: Number(previousVariant.availableStock || 0),
                newStock: Number(updatedVariant.availableStock || 0),
                notes: this.buildStockMovementNote(
                  data.purchaseInvoiceNumber,
                  item,
                ),
              },
            ],
            { session },
          );
        }

        const purchaseAmount = Number(
          data.totalNetAmount || data.total || data.subTotal || 0,
        );

        if (purchaseAmount > 0) {
          await this.journalVoucherService.createDoubleEntry(
            {
              voucherNumber: data.purchaseInvoiceNumber,
              referenceId: data.purchaseInvoiceNumber,
              transactionDate: data.invoiceDate || new Date(),
              description: `Purchase Invoice Posted - ${data.purchaseInvoiceNumber}`,
              debitEntry: {
                accountNumber: 'Inventory',
                amount: purchaseAmount,
              },
              creditEntry: {
                accountNumber: 'Accounts Payable',
                amount: purchaseAmount,
              },
            },
            session,
          );
        }
      });

      if (!createdInvoice) {
        throw new InternalServerErrorException(
          'Purchase invoice transaction completed without creating an invoice',
        );
      }

      return createdInvoice;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to finalize purchase invoice and update inventory',
      );
    } finally {
      await session.endSession();
    }
  }

  async updateInvoice(
    purchaseInvoiceNumber: string,
    data: CreatePurchaseInvoiceDto,
  ): Promise<PurchaseInvoice | null> {
    // purchaseInvoiceNumber is stored as a number in the schema
    return await this.purchaseInvoiceModel
      .findOneAndUpdate({ purchaseInvoiceNumber }, data, { new: true })
      .exec();
  }

  async deleteInvoice(purchaseInvoiceNumber: string) {
    return await this.purchaseInvoiceModel
      .findOneAndDelete({ purchaseInvoiceNumber })
      .exec();
  }

  private validateStockMovements(items: PurchaseInvoiceLineItem[]): void {
    for (const item of items) {
      this.getVariantIdentifier(item);

      if (
        !Number.isFinite(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      ) {
        throw new BadRequestException(
          `Invalid purchase quantity for ${item.productName || item.itemName || 'line item'}`,
        );
      }
    }
  }

  private getVariantIdentifier(item: PurchaseInvoiceLineItem): string {
    const identifier =
      item.sku || item.variantId || item.inventoryId || item.id || item._id;

    if (!identifier) {
      throw new BadRequestException(
        `Missing variant identifier for ${item.productName || item.itemName || 'line item'}`,
      );
    }

    return String(identifier);
  }

  private buildStockMovementNote(
    purchaseInvoiceNumber: string,
    item: PurchaseInvoiceLineItem,
  ): string {
    const productLabel = item.productName || item.itemName || 'Variant';
    const attributes = [item.thickness, item.color, item.length]
      .filter(Boolean)
      .join(' / ');

    return attributes
      ? `Purchase ${purchaseInvoiceNumber} - ${productLabel} (${attributes})`
      : `Purchase ${purchaseInvoiceNumber} - ${productLabel}`;
  }
}
