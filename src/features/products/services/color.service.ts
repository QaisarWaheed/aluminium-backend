/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Color } from '../entities/Color.entity';
import { CreateColorDto } from '../dtos/CreateColor';
import { UpdateColorDto } from '../dtos/UpdateColor';

@Injectable()
export class ColorService {
    constructor(
        @InjectModel(Color.name) private colorModel: Model<Color>
    ) { }

    async findAll(): Promise<Color[]> {
        return this.colorModel.find().sort({ name: 1 }).exec();
    }

    async findById(id: string): Promise<Color | null> {
        return this.colorModel.findById(id).exec();
    }

    async create(createColorDto: CreateColorDto): Promise<Color> {
        const newColor = new this.colorModel(createColorDto);
        return newColor.save();
    }

    async update(id: string, updateColorDto: UpdateColorDto): Promise<Color | null> {
        return this.colorModel
            .findByIdAndUpdate(id, updateColorDto, { new: true })
            .exec();
    }

    async delete(id: string): Promise<Color | null> {
        return this.colorModel.findByIdAndDelete(id).exec();
    }
}
