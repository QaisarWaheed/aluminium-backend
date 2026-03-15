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
import { StockMovementService } from 'src/features/products/services/stock-movement.service';
import { StockTransactionType } from 'src/features/products/entities/StockLedger.entity';

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

@Injectable()
export class SalesReturnService {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    @InjectModel('SalesReturn')
    private readonly salesReturnModel: Model<SalesReturn>,
    private readonly stockMovementService: StockMovementService,
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
        const items: SalesReturnLineItem[] = Array.isArray(data.products)
          ? data.products.map((item) => item as unknown as SalesReturnLineItem)
          : [];

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

          await this.stockMovementService.adjustStock(
            variantId,
            quantity,
            'IN',
            {
              session,
              referenceId: data.invoiceNumber,
              transactionType: StockTransactionType.RETURN,
              notes: this.buildReturnNote(data.invoiceNumber, item),
            },
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
