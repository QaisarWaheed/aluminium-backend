/* eslint-disable prettier/prettier */
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
import { ColorService } from '../services/color.service';
import { CreateColorDto } from '../dtos/CreateColor';
import { UpdateColorDto } from '../dtos/UpdateColor';

@ApiTags('Colors')
@Controller('colors')
export class ColorController {
    constructor(private readonly colorService: ColorService) { }

    @Get()
    async findAll() {
        return this.colorService.findAll();
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.colorService.findById(id);
    }

    @Post()
    async create(@Body() createColorDto: CreateColorDto) {
        return this.colorService.create(createColorDto);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateColorDto: UpdateColorDto
    ) {
        return this.colorService.update(id, updateColorDto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.colorService.delete(id);
    }
}
