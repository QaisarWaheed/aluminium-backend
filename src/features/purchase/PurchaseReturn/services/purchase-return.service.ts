/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { PurchaseReturn } from '../entities/PurchaseReturn.entity';
import { Connection, Model } from 'mongoose';
import { CreatePurchaseReturnDto } from '../dtos/CreatePurchaseReturn.dto';
import { StockMovementService } from 'src/features/products/services/stock-movement.service';
import { StockTransactionType } from 'src/features/products/entities/StockLedger.entity';
import { JournalvoucherService } from 'src/features/Accounts/journalVoucher/services/journalvoucher/journalvoucher.service';

type SupplierLike = { name?: string } | Array<{ name?: string }>;

type PurchaseReturnLineItem = {
  sku?: string;
  _id?: string;
  id?: string;
  quantity?: number;
  itemName?: string;
  productName?: string;
  thickness?: string;
  color?: string;
};

function getSupplierName(supplier: SupplierLike): string {
  if (Array.isArray(supplier)) {
    return supplier[0]?.name ?? '';
  }

  return supplier.name ?? '';
}

@Injectable()
export class PurchaseReturnService {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    @InjectModel('PurchaseReturn')
    private readonly purchaseReturnModel: Model<PurchaseReturn>,
    private readonly stockMovementService: StockMovementService,
    private readonly journalVoucherService: JournalvoucherService,
  ) {}

  async findAll(): Promise<PurchaseReturn[]> {
    return await this.purchaseReturnModel.find();
  }

  // Find by returnNumber or by _id if needed
  async findById(idOrReturnNumber: string): Promise<PurchaseReturn | null> {
    // Try by returnNumber first
    const byReturn = await this.purchaseReturnModel.findOne({
      returnNumber: idOrReturnNumber,
    });
    if (byReturn) return byReturn;
    // Fallback to findById
    return await this.purchaseReturnModel.findById(idOrReturnNumber);
  }

  async createInvoice(data: CreatePurchaseReturnDto): Promise<PurchaseReturn> {
    const session = await this.connection.startSession();

    try {
      let createdReturn: PurchaseReturn | null = null;

      await session.withTransaction(async () => {
        const payload = { ...data } as Record<string, unknown>;
        const items: PurchaseReturnLineItem[] = Array.isArray(data.products)
          ? data.products.map(
              (item) => item as unknown as PurchaseReturnLineItem,
            )
          : [];

        if (payload.supplier && typeof payload.supplier !== 'string') {
          const supplier = payload.supplier as SupplierLike;
          payload.supplier = getSupplierName(supplier);
        }

        const [purchaseReturn] = await this.purchaseReturnModel.create(
          [payload],
          {
            session,
          },
        );
        createdReturn = purchaseReturn;

        for (const item of items) {
          const variantId = item.sku || item._id || item.id;
          const quantity = Number(item.quantity || 0);

          if (!variantId || quantity <= 0) {
            throw new BadRequestException(
              'Purchase return items must include a valid variant identifier and quantity',
            );
          }

          await this.stockMovementService.adjustStock(
            variantId,
            quantity,
            'OUT',
            {
              session,
              referenceId: data.returnNumber,
              transactionType: StockTransactionType.RETURN,
              notes: this.buildReturnNote(data.returnNumber, item),
            },
          );
        }

        const returnAmount = Number(data.total || data.subTotal || 0);

        if (returnAmount > 0) {
          await this.journalVoucherService.createDoubleEntry(
            {
              voucherNumber: data.returnNumber,
              referenceId: data.returnNumber,
              transactionDate: data.returnDate || new Date(),
              description: `Purchase Return Posted - ${data.returnNumber}`,
              debitEntry: {
                accountNumber: 'Accounts Payable',
                amount: returnAmount,
              },
              creditEntry: {
                accountNumber: 'Inventory',
                amount: returnAmount,
              },
            },
            session,
          );
        }
      });

      if (!createdReturn) {
        throw new InternalServerErrorException(
          'Purchase return transaction completed without creating a return',
        );
      }

      return createdReturn;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to create purchase return and update stock atomically',
      );
    } finally {
      await session.endSession();
    }
  }

  async updateInvoice(
    returnNumber: string,
    data: CreatePurchaseReturnDto,
  ): Promise<PurchaseReturn | null> {
    const payload = { ...data } as Record<string, unknown>;
    if (payload.supplier && typeof payload.supplier !== 'string') {
      const supplier = payload.supplier as SupplierLike;
      payload.supplier = getSupplierName(supplier);
    }
    return await this.purchaseReturnModel.findOneAndUpdate(
      { returnNumber },
      payload,
      { new: true },
    );
  }

  async deleteInvoice(returnNumber: string) {
    return await this.purchaseReturnModel.findOneAndDelete({ returnNumber });
  }

  // Compute next PRET-XXXX return number
  async getNextReturnNumber(): Promise<string> {
    const docs = await this.purchaseReturnModel
      .find()
      .select('returnNumber')
      .lean();
    const nums = (docs || [])
      .map((d: PurchaseReturn) => {
        const match = String(d.returnNumber || '').match(/PRET-(\d{4})/i);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((n: number | null): n is number => n !== null);
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    const next = max + 1;
    return `PRET-${next.toString().padStart(4, '0')}`;
  }

  private buildReturnNote(
    returnNumber: string,
    item: PurchaseReturnLineItem,
  ): string {
    const productLabel = item.itemName || item.productName || 'Variant';
    const attributes = [item.thickness, item.color].filter(Boolean).join(' / ');

    return attributes
      ? `Purchase return ${returnNumber} - ${productLabel} (${attributes})`
      : `Purchase return ${returnNumber} - ${productLabel}`;
  }
}
