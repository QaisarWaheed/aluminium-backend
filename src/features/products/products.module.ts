import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { productSchema } from './entities/Product.entity';
import { categorySchema } from './entities/Category.entity';
import { colorSchema } from './entities/Color.entity';
import { ProductsController } from './controller/products.controller';
import { ProductService } from './services/product.service';
import { CategoryController } from './controller/category.controller';
import { CategoryService } from './services/category.service';
import { ColorController } from './controller/color.controller';
import { ColorService } from './services/color.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Product', schema: productSchema },
      { name: 'Category', schema: categorySchema },
      { name: 'Color', schema: colorSchema },
    ]),
  ],
  providers: [ProductService, CategoryService, ColorService],
  controllers: [ProductsController, CategoryController, ColorController],
})
export class ProductsModule {}
