import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto } from '../dtos/CreateCategory';
import { UpdateCategoryDto } from '../dtos/UpdateCategory';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async createCategory(@Body() data: CreateCategoryDto) {
    return this.categoryService.create(data);
  }

  @Get()
  async getAll() {
    return this.categoryService.findAll();
  }

  @Get('/:id')
  async getById(@Param('id') id: string) {
    return this.categoryService.findById(id);
  }

  @Put('/:id')
  async update(@Param('id') id: string, @Body() data: UpdateCategoryDto) {
    return this.categoryService.update(id, data);
  }

  @Delete('/:id')
  async remove(@Param('id') id: string) {
    return this.categoryService.delete(id);
  }
}
