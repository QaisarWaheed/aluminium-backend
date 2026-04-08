/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Quotation } from '../../quotation.entity';
import { CreateQuotationDto } from '../../createQuotation.dto';
import { JournalvoucherService } from '../../../../Accounts/journalVoucher/services/journalvoucher/journalvoucher.service';
import { CreateJournalVoucherDto } from '../../../../Accounts/journalVoucher/dtos/create-journal-voucher/create-journal-voucher.dto';
import { Product } from 'src/features/products/entities/Product.entity';

type QuotationLineItem = {
  sku?: string;
  productId?: string;
  _id?: string;
  brand?: string;
};

type QuotationCustomer = { name?: string } | Array<{ name?: string }> | null;

function getQuotationCustomerName(customer: QuotationCustomer): string {
  if (Array.isArray(customer)) {
    return customer[0]?.name || 'Unknown';
  }

  return customer?.name || 'Unknown';
}

@Injectable()
export class QuotationService {
  constructor(
    @InjectModel('Quotation')
    private readonly saleInvoiceModel: Model<Quotation>,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    private readonly journalVoucherService: JournalvoucherService,
  ) {}

  private async normalizeBrandsFromProductMaster(
    data: CreateQuotationDto,
  ): Promise<CreateQuotationDto> {
    const products = Array.isArray(data.products)
      ? data.products.map((item) => ({
          ...(item as unknown as Record<string, unknown>),
        }))
      : [];

    for (const rawItem of products) {
      const item = rawItem as unknown as QuotationLineItem;
      const variantId = String(item.sku || item.productId || item._id || '');
      if (!variantId) continue;

      const sourceProduct = await this.productModel
        .findOne({
          $or: [
            { 'variants.sku': variantId },
            { 'variants._id': variantId },
            { _id: variantId },
          ],
        })
        .select('brand')
        .exec();

      if (sourceProduct?.brand) {
        rawItem.brand = sourceProduct.brand;
      }
    }

    return {
      ...data,
      products: products as unknown as CreateQuotationDto['products'],
    };
  }

  async findAll(): Promise<Quotation[]> {
    return await this.saleInvoiceModel.find();
  }

  async findById(id: string): Promise<Quotation | null> {
    return await this.saleInvoiceModel.findById(id);
  }

  async createInvoice(data: CreateQuotationDto): Promise<Quotation> {
    const normalizedData = await this.normalizeBrandsFromProductMaster(data);
    const quotation = await this.saleInvoiceModel.create(normalizedData);

    // Ledger Entry for Quotation
    try {
      const customerName = getQuotationCustomerName(
        normalizedData.customer as QuotationCustomer,
      );
      const journalDto: CreateJournalVoucherDto = {
        date: new Date(), // Quotation date usually today
        voucherNumber: normalizedData.quotationNumber,
        accountNumber: customerName,
        description: `Quotation Created - ${normalizedData.quotationNumber}`,
        debit: 0, // No financial impact yet
        credit: 0,
      };
      await this.journalVoucherService.create(journalDto);
    } catch (error) {
      console.error('Error creating ledger entry for quotation:', error);
      // We don't fail quotation creation if ledger log fails, as it's non-financial?
      // Requirement says "Create ledger entry...". Phase 1 says "Fixed".
      // I'll leave it as try-catch log only for now to avoid blocking quotation if ledger is strict.
    }

    return quotation;
  }

  async updateInvoice(
    id: string,
    data: CreateQuotationDto,
  ): Promise<Quotation | null> {
    const normalizedData = await this.normalizeBrandsFromProductMaster(data);

    return await this.saleInvoiceModel.findByIdAndUpdate(id, normalizedData, {
      new: true,
    });
  }

  async deleteInvoice(id: string) {
    return await this.saleInvoiceModel.findByIdAndDelete(id);
  }
}
