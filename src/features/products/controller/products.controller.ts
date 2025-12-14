/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from '../services/product.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateProductDto } from '../dtos/CreateProduct';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PaginationDto } from '../../../common/dtos/pagination.dto';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async getAllProducts(@Query() paginationDto: PaginationDto) {
    const products = await this.productService.findAll(paginationDto);
    console.log('Fetched products');
    return products;
  }

  @Get('/:id')
  async getProductById(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @Post()
  async createProduct(@Body() productData: CreateProductDto) {
    console.log('Creating product with data:', productData);
    return this.productService.addProduct(productData);
  }

  @Put('/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() productData: Partial<CreateProductDto>,
  ) {
    return this.productService.updateProduct(id, productData);
  }

  @Delete('/:id')
  async deleteProduct(@Param('id') id: string) {
    return this.productService.deleteProduct(id);
  }
}
export default ProductsController;
