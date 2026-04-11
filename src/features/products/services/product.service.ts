/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ClientSession, Model } from 'mongoose';
import { Product, ProductVariant } from '../entities/Product.entity';
import { CreateProductDto } from '../dtos/CreateProduct';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { SkuService } from './sku.service';
import {
  StockLedgerService,
  StockTransactionDto,
} from './stock-ledger.service';
import { StockTransactionType } from '../entities/StockLedger.entity';

export type StockValuationRow = {
  productId: string;
  productName: string;
  category: string;
  brand: string;
  sku: string;
  thickness: string;
  color: string;
  length: string;
  availableStock: number;
  totalFeet: number;
  purchasePrice: number;
  inventoryValue: number;
};

export type StockValuationSummary = {
  totalItems: number;
  totalRunningFeet: number;
  totalInventoryValue: number;
};

export type GroupedValuationSummary = {
  totalItems: number;
  totalRunningFeet: number;
  totalInventoryValue: number;
};

export type StockValuationReport = {
  summary: StockValuationSummary;
  groupedByCategory: Record<string, GroupedValuationSummary>;
  groupedByBrand: Record<string, GroupedValuationSummary>;
  rows: StockValuationRow[];
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isValidationError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: string }).name === 'ValidationError'
  );
}

@Injectable()
export class ProductService {
  constructor(
    @InjectModel('Product') private readonly productModel: Model<Product>,
    private readonly skuService: SkuService,
    private readonly stockLedgerService: StockLedgerService,
  ) {}

  async findAll(
    paginationDto: PaginationDto = { page: 1, limit: 10 },
  ): Promise<PaginatedResult<Product>> {
    try {
      const { page = 1, limit = 10, search, category } = paginationDto;
      const skip = (page - 1) * limit;
      const trimmedSearch = search?.trim();
      const trimmedCategory = category?.trim();
      const query = {
        ...(trimmedCategory ? { category: trimmedCategory } : {}),
        ...(trimmedSearch
          ? {
              $or: [
                {
                  itemName: {
                    $regex: escapeRegex(trimmedSearch),
                    $options: 'i',
                  },
                },
                {
                  category: {
                    $regex: escapeRegex(trimmedSearch),
                    $options: 'i',
                  },
                },
                {
                  brand: { $regex: escapeRegex(trimmedSearch), $options: 'i' },
                },
                {
                  'variants.sku': {
                    $regex: escapeRegex(trimmedSearch),
                    $options: 'i',
                  },
                },
                {
                  'variants.color': {
                    $regex: escapeRegex(trimmedSearch),
                    $options: 'i',
                  },
                },
                {
                  'variants.length': {
                    $regex: escapeRegex(trimmedSearch),
                    $options: 'i',
                  },
                },
                {
                  'variants.thickness': {
                    $regex: escapeRegex(trimmedSearch),
                    $options: 'i',
                  },
                },
              ],
            }
          : {}),
      };

      const [data, total] = await Promise.all([
        this.productModel
          .find(query)
          .sort({ itemName: 1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.productModel.countDocuments(query).exec(),
      ]);

      return {
        data,
        total,
        page,
        lastPage: Math.max(1, Math.ceil(total / limit)),
      };
    } catch {
      throw new InternalServerErrorException('Failed to fetch products');
    }
  }

  async findById(_id: string): Promise<Product | null> {
    try {
      const product = await this.productModel.findById(_id).exec();
      if (!product) {
        throw new NotFoundException(`Product ${_id} not found`);
      }
      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to fetch product');
    }
  }

  async addProduct(product: CreateProductDto): Promise<Product> {
    try {
      // Check if product with the same item name already exists
      const existingProductWithName = await this.productModel
        .findOne({
          itemName: new RegExp(`^${escapeRegex(product.itemName)}$`, 'i'),
        })
        .exec();
      if (existingProductWithName) {
        throw new BadRequestException(
          `Product with item name "${product.itemName}" already exists.`,
        );
      }

      // Get all existing SKUs to avoid collisions
      const existingProducts = await this.productModel.find().exec();
      const existingSkus = existingProducts
        .flatMap((p) => p.variants?.map((v) => v.sku) || [])
        .filter(Boolean);

      // Generate SKUs for all variants
      const processedVariants = product.variants.map((variant) => {
        const sku = this.skuService.generateUniqueSku(
          product.itemName,
          variant.thickness,
          variant.color,
          variant.length,
          existingSkus,
        );

        existingSkus.push(sku); // Add to list to prevent duplicates in this batch

        return {
          ...variant,
          sku,
          availableStock: variant.openingStock || 0, // Initialize available stock
        };
      });

      // Create product with generated SKUs
      const productWithSkus = {
        ...product,
        variants: processedVariants,
      };

      const newProduct = await this.productModel.create(productWithSkus);

      // Create stock ledger entries for opening stock
      const stockEntries: StockTransactionDto[] = processedVariants
        .filter((variant) => variant.openingStock && variant.openingStock > 0)
        .map((variant) => ({
          transactionType: StockTransactionType.OPENING_STOCK,
          productId: newProduct._id.toString(),
          sku: variant.sku,
          length: variant.length,
          quantityChange: variant.openingStock || 0,
          previousStock: 0,
          notes: `Opening stock for ${product.itemName} - ${variant.thickness} - ${variant.color} - ${variant.length}`,
        }));

      if (stockEntries.length > 0) {
        await this.stockLedgerService.createBulkStockEntries(stockEntries);
      }

      return newProduct;
    } catch (error) {
      if (isValidationError(error)) {
        throw new BadRequestException(getErrorMessage(error));
      }

      throw new InternalServerErrorException(
        `Failed to add product: ${getErrorMessage(error)}`,
      );
    }
  }

  async updateProduct(
    _id: string,
    productUpdate: Partial<CreateProductDto>,
  ): Promise<Product | null> {
    try {
      const existingProduct = await this.productModel.findById(_id).exec();
      if (!existingProduct) {
        throw new NotFoundException(`Product ${_id} not found`);
      }

      if (
        productUpdate.itemName &&
        productUpdate.itemName !== existingProduct.itemName
      ) {
        const existingProductWithName = await this.productModel
          .findOne({
            itemName: new RegExp(
              `^${escapeRegex(productUpdate.itemName)}$`,
              'i',
            ),
            _id: { $ne: _id },
          })
          .exec();
        if (existingProductWithName) {
          throw new BadRequestException(
            `Product with item name "${productUpdate.itemName}" already exists.`,
          );
        }
      }

      // If variants are being updated, handle SKU generation
      if (productUpdate.variants) {
        const existingProducts = await this.productModel
          .find({ _id: { $ne: _id } })
          .exec();
        const existingSkus = existingProducts
          .flatMap((p) => p.variants?.map((v) => v.sku) || [])
          .filter(Boolean);

        // Keep existing variants with their SKUs, generate for new ones
        const processedVariants = productUpdate.variants.map((variant) => {
          // Check if this variant already exists (by thickness + color)
          const existingVariant = existingProduct.variants?.find(
            (v) =>
              v.thickness === variant.thickness &&
              v.color === variant.color &&
              v.length === variant.length,
          );

          if (existingVariant) {
            // Update existing variant, keep existing SKU
            return {
              ...variant,
              sku: existingVariant.sku,
              availableStock:
                variant.openingStock || existingVariant.availableStock || 0,
            };
          } else {
            // Generate SKU for new variant
            const sku = this.skuService.generateUniqueSku(
              productUpdate.itemName || existingProduct.itemName,
              variant.thickness,
              variant.color,
              variant.length,
              existingSkus,
            );

            existingSkus.push(sku);

            return {
              ...variant,
              sku,
              availableStock: variant.openingStock || 0,
            };
          }
        });

        productUpdate.variants = processedVariants;

        // Create stock ledger entries for new variants with opening stock
        const newVariants = processedVariants.filter((variant) => {
          const existingVariant = existingProduct.variants?.find(
            (v) =>
              v.thickness === variant.thickness &&
              v.color === variant.color &&
              v.length === variant.length,
          );
          return (
            !existingVariant && variant.openingStock && variant.openingStock > 0
          );
        });

        const stockEntries: StockTransactionDto[] = newVariants.map(
          (variant) => ({
            transactionType: StockTransactionType.OPENING_STOCK,
            productId: _id,
            sku: variant.sku,
            length: variant.length,
            quantityChange: variant.openingStock || 0,
            previousStock: 0,
            notes: `Opening stock for new variant ${productUpdate.itemName || existingProduct.itemName} - ${variant.thickness} - ${variant.color} - ${variant.length}`,
          }),
        );

        if (stockEntries.length > 0) {
          await this.stockLedgerService.createBulkStockEntries(stockEntries);
        }
      }

      return await this.productModel
        .findByIdAndUpdate(_id, productUpdate, { new: true })
        .exec();
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (isValidationError(error)) {
        throw new BadRequestException(getErrorMessage(error));
      }

      throw new InternalServerErrorException(
        `Failed to update product: ${getErrorMessage(error)}`,
      );
    }
  }

  async deleteProduct(_id: string): Promise<Product | null> {
    return await this.productModel.findByIdAndDelete(_id).exec();
  }

  /**
   * Find variant by SKU across all products
   */
  async findVariantBySku(
    sku: string,
    session?: ClientSession,
  ): Promise<{ product: Product; variant: ProductVariant } | null> {
    const product = await this.productModel
      .findOne({ 'variants.sku': sku })
      .session(session ?? null)
      .exec();
    if (!product) return null;

    const variant = product.variants?.find((v) => v.sku === sku);
    return variant ? { product, variant } : null;
  }

  /**
   * Update variant stock (used by sales processing)
   */
  async updateVariantStock(
    sku: string,
    newStock: number,
    session?: ClientSession,
  ): Promise<boolean> {
    try {
      const result = await this.productModel
        .updateOne(
          { 'variants.sku': sku },
          { $set: { 'variants.$.availableStock': newStock } },
          session ? { session } : undefined,
        )
        .exec();

      return result.modifiedCount > 0;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to update stock for SKU ${sku}: ${getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Get current stock for a variant
   */
  async getVariantStock(sku: string, session?: ClientSession): Promise<number> {
    const variantData = await this.findVariantBySku(sku, session);
    return variantData?.variant.availableStock ?? 0;
  }

  /**
   * Bulk stock update for multiple variants (used in sales processing)
   */
  async bulkUpdateVariantStock(
    stockUpdates: { sku: string; newStock: number }[],
    session?: ClientSession,
  ): Promise<void> {
    await this.productModel.bulkWrite(
      stockUpdates.map((update) => ({
        updateOne: {
          filter: { 'variants.sku': update.sku },
          update: {
            $set: { 'variants.$.availableStock': update.newStock },
          },
        },
      })),
      session ? { session } : undefined,
    );
  }

  async getStockValuationReport(): Promise<StockValuationReport> {
    const products = await this.productModel.find().lean().exec();

    const rows: StockValuationRow[] = [];
    const groupedByCategory: Record<string, GroupedValuationSummary> = {};
    const groupedByBrand: Record<string, GroupedValuationSummary> = {};

    let totalItems = 0;
    let totalRunningFeet = 0;
    let totalInventoryValue = 0;

    for (const product of products) {
      const category = String(product.category || 'Uncategorized');
      const brand = String(product.brand || 'Unbranded');
      const variants = Array.isArray(product.variants) ? product.variants : [];

      for (const variant of variants) {
        const availableStock = Number(variant.availableStock || 0);
        const purchasePrice = Number(variant.purchasePrice || 0);
        const length = String(variant.length || '0');
        const lengthNumber = Number(length);
        const totalFeet =
          availableStock * (Number.isFinite(lengthNumber) ? lengthNumber : 0);
        const inventoryValue = availableStock * purchasePrice;

        rows.push({
          productId: String(product._id),
          productName: String(product.itemName || ''),
          category,
          brand,
          sku: String(variant.sku || ''),
          thickness: String(variant.thickness || ''),
          color: String(variant.color || ''),
          length,
          availableStock,
          totalFeet,
          purchasePrice,
          inventoryValue,
        });

        totalItems += availableStock;
        totalRunningFeet += totalFeet;
        totalInventoryValue += inventoryValue;

        if (!groupedByCategory[category]) {
          groupedByCategory[category] = {
            totalItems: 0,
            totalRunningFeet: 0,
            totalInventoryValue: 0,
          };
        }

        if (!groupedByBrand[brand]) {
          groupedByBrand[brand] = {
            totalItems: 0,
            totalRunningFeet: 0,
            totalInventoryValue: 0,
          };
        }

        groupedByCategory[category].totalItems += availableStock;
        groupedByCategory[category].totalRunningFeet += totalFeet;
        groupedByCategory[category].totalInventoryValue += inventoryValue;

        groupedByBrand[brand].totalItems += availableStock;
        groupedByBrand[brand].totalRunningFeet += totalFeet;
        groupedByBrand[brand].totalInventoryValue += inventoryValue;
      }
    }

    return {
      summary: {
        totalItems,
        totalRunningFeet,
        totalInventoryValue,
      },
      groupedByCategory,
      groupedByBrand,
      rows,
    };
  }
}
