/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Connection, Model } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { SalesReturn } from '../../salesReturn.entity';
import { CreateSalesReturnDto } from '../../salesReturn.dto';
import {
  StockLedger,
  StockTransactionType,
} from 'src/features/products/entities/StockLedger.entity';
import { JournalvoucherService } from 'src/features/Accounts/journalVoucher/services/journalvoucher/journalvoucher.service';
import { Product } from 'src/features/products/entities/Product.entity';
import { SalesInvoice } from 'src/features/sales/salesInvoice/salesinvoice.entity';

type SalesReturnLineItem = {
  sku?: string;
  _id?: string;
  id?: string;
  quantity?: number;
  itemName?: string;
  productName?: string;
  thickness?: string;
  color?: string;
};

type SalesReturnPayload = CreateSalesReturnDto & {
  metadata?: {
    sourceInvoiceNumber?: string;
    originalInvoiceNumber?: string;
  };
};

@Injectable()
export class SalesReturnService {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    @InjectModel('SalesReturn')
    private readonly salesReturnModel: Model<SalesReturn>,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    @InjectModel(StockLedger.name)
    private readonly stockLedgerModel: Model<StockLedger>,
    @InjectModel('SalesInvoice')
    private readonly salesInvoiceModel: Model<SalesInvoice>,
    private readonly journalVoucherService: JournalvoucherService,
  ) {}

  async findAll(): Promise<SalesReturn[]> {
    return await this.salesReturnModel.find();
  }

  async findByInvoiceNumber(
    invoiceNumber: string,
  ): Promise<SalesReturn | null> {
    return await this.salesReturnModel
      .findOne({ invoiceNumber: invoiceNumber })
      .exec();
  }

  async createInvoice(data: CreateSalesReturnDto): Promise<SalesReturn> {
    const session = await this.connection.startSession();

    try {
      let createdReturn: SalesReturn | null = null;

      await session.withTransaction(async () => {
        const payload = data as SalesReturnPayload;
        const items: SalesReturnLineItem[] = Array.isArray(data.products)
          ? data.products.map((item) => item as unknown as SalesReturnLineItem)
          : [];

        const sourceInvoiceNumber =
          payload.metadata?.sourceInvoiceNumber ||
          payload.metadata?.originalInvoiceNumber;

        if (sourceInvoiceNumber) {
          const sourceSale = await this.salesInvoiceModel
            .findOne({ invoiceNumber: sourceInvoiceNumber })
            .session(session)
            .exec();

          if (!sourceSale) {
            throw new BadRequestException(
              `Original sale not found: ${sourceInvoiceNumber}`,
            );
          }
        }

        const [salesReturn] = await this.salesReturnModel.create([data], {
          session,
        });
        createdReturn = salesReturn;

        for (const item of items) {
          const variantId = item.sku || item._id || item.id;
          const quantity = Number(item.quantity || 0);

          if (!variantId || quantity <= 0) {
            throw new BadRequestException(
              'Sales return items must include a valid variant identifier and quantity',
            );
          }

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
                quantityChange: quantity,
                transactionType: StockTransactionType.RETURN,
                referenceId: data.invoiceNumber,
                previousStock: Number(previousVariant.availableStock || 0),
                newStock: Number(updatedVariant.availableStock || 0),
                notes: this.buildReturnNote(data.invoiceNumber, item),
              },
            ],
            { session },
          );
        }

        const returnAmount = Number(data.totalNetAmount || data.subTotal || 0);

        if (returnAmount > 0) {
          await this.journalVoucherService.createDoubleEntry(
            {
              voucherNumber: data.invoiceNumber,
              referenceId: data.invoiceNumber,
              transactionDate: data.invoiceDate || new Date(),
              description: `Sales Return Posted - ${data.invoiceNumber}`,
              debitEntry: {
                accountNumber: 'Sales Returns and Allowances',
                amount: returnAmount,
              },
              creditEntry: {
                accountNumber: 'Accounts Receivable',
                amount: returnAmount,
              },
            },
            session,
          );
        }
      });

      if (!createdReturn) {
        throw new InternalServerErrorException(
          'Sales return transaction completed without creating a return',
        );
      }

      return createdReturn;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to create sales return and update stock atomically',
      );
    } finally {
      await session.endSession();
    }
  }

  async updateInvoice(
    id: string,
    data: CreateSalesReturnDto,
  ): Promise<SalesReturn | null> {
    return await this.salesReturnModel
      .findOneAndUpdate({ invoiceNumber: id }, data, {
        new: true,
      })
      .exec();
  }

  async deleteInvoice(id: string) {
    return await this.salesReturnModel
      .findOneAndDelete({ invoiceNumber: id })
      .exec();
  }

  private buildReturnNote(
    invoiceNumber: string,
    item: SalesReturnLineItem,
  ): string {
    const productLabel = item.itemName || item.productName || 'Variant';
    const attributes = [item.thickness, item.color].filter(Boolean).join(' / ');

    return attributes
      ? `Sales return ${invoiceNumber} - ${productLabel} (${attributes})`
      : `Sales return ${invoiceNumber} - ${productLabel}`;
  }
}
