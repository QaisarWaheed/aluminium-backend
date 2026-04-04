import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { productSchema } from './entities/Product.entity';
import { categorySchema } from './entities/Category.entity';
import { colorSchema } from './entities/Color.entity';
import { StockLedgerSchema, StockLedger } from './entities/StockLedger.entity';
import { ProductsController } from './controller/products.controller';
import { ProductService } from './services/product.service';
import { CategoryController } from './controller/category.controller';
import { CategoryService } from './services/category.service';
import { ColorController } from './controller/color.controller';
import { ColorService } from './services/color.service';
import { SkuService } from './services/sku.service';
import { StockLedgerService } from './services/stock-ledger.service';
import { StockLedgerController } from './controller/stock-ledger.controller';
import { StockMovementService } from './services/stock-movement.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Product', schema: productSchema },
      { name: 'Category', schema: categorySchema },
      { name: 'Color', schema: colorSchema },
      { name: StockLedger.name, schema: StockLedgerSchema },
    ]),
  ],
  providers: [
    ProductService,
    CategoryService,
    ColorService,
    SkuService,
    StockLedgerService,
    StockMovementService,
  ],
  controllers: [
    ProductsController,
    CategoryController,
    ColorController,
    StockLedgerController,
  ],
  exports: [
    MongooseModule,
    ProductService,
    SkuService,
    StockLedgerService,
    StockMovementService,
  ], // Export for use in sales and purchase modules
})
export class ProductsModule {}
