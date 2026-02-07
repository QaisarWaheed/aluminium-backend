/* eslint-disable prettier/prettier */
import { HttpException, Injectable } from '@nestjs/common';
import { RecieptVoucher } from '../reciept.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRecipetVoucherDto } from '../createReciept.dto';

@Injectable()
export class RecieptVoucherService {

    constructor(
        @InjectModel('RecieptVoucher') private readonly recieptVoucherModel: Model<RecieptVoucher>) { }


    async findAll(): Promise<RecieptVoucher[]> {
        try {
            return await this.recieptVoucherModel.find().exec();
        } catch (error) {
            throw new Error('Error fetching products');
        }
    }


    async findById(id: string): Promise<RecieptVoucher | null> {
        try {
            const product = await this.recieptVoucherModel.findById(id).exec()
            if (!product) {
                throw new HttpException('No Product Found Against this Id', 404)
            }
            return product;
        } catch (error) {
            throw new Error('Error fetching product by ID');
        }
    }


    async addReceiptVoucher(product: CreateRecipetVoucherDto): Promise<RecieptVoucher> {

        const newProduct = await this.recieptVoucherModel.create(product);
        return newProduct;

    }


    async updateReceiptVoucher(id: string, product: Partial<CreateRecipetVoucherDto>): Promise<RecieptVoucher | null> {
        try {
            return await this.recieptVoucherModel.findByIdAndUpdate(id, product, { new: true }).exec();
        } catch (error) {
            throw new Error('Error updating product');
        }
    }

    async deleteReceiptVoucher(id: string): Promise<RecieptVoucher | null> {
        return await this.recieptVoucherModel.findByIdAndDelete(id).exec();
    }









}
