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
import { StockMovementService } from 'src/features/products/services/stock-movement.service';
import { StockTransactionType } from 'src/features/products/entities/StockLedger.entity';

type PurchaseInvoiceLineItem = {
  sku?: string;
  variantId?: string;
  inventoryId?: string;
  id?: string;
  _id?: string;
  quantity?: number;
  productName?: string;
  itemName?: string;
  thickness?: string;
  color?: string;
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
    private readonly stockMovementService: StockMovementService,
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

          await this.stockMovementService.adjustStock(
            variantId,
            quantity,
            'IN',
            {
              session,
              referenceId: data.purchaseInvoiceNumber,
              transactionType: StockTransactionType.PURCHASE,
              notes: this.buildStockMovementNote(
                data.purchaseInvoiceNumber,
                item,
              ),
            },
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
    const attributes = [item.thickness, item.color].filter(Boolean).join(' / ');

    return attributes
      ? `Purchase ${purchaseInvoiceNumber} - ${productLabel} (${attributes})`
      : `Purchase ${purchaseInvoiceNumber} - ${productLabel}`;
  }
}
