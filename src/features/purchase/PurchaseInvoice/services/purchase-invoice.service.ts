/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PurchaseInvoice } from '../entities/PurchaseInvoice.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreatePurchaseInvoiceDto } from '../dtos/CreatePurchaseInvoiceDto.dto';


@Injectable()
export class PurchaseInvoiceService {

    constructor(@InjectModel('PurchaseInvoice') private readonly purchaseInvoiceModel: Model<PurchaseInvoice>) { }


    async findAll(): Promise<PurchaseInvoice[]> {
        return await this.purchaseInvoiceModel.find();
    }

    async findByInvoiceNumber(purchaseInvoiceNumber: string): Promise<PurchaseInvoice | null> {
        return await this.purchaseInvoiceModel.findOne({ purchaseInvoiceNumber });
    }

    async createInvoice(data: CreatePurchaseInvoiceDto): Promise<PurchaseInvoice> {
        return await this.purchaseInvoiceModel.create(data)
    }

    async updateInvoice(purchaseInvoiceNumber: string, data: CreatePurchaseInvoiceDto): Promise<PurchaseInvoice | null> {
        // purchaseInvoiceNumber is stored as a number in the schema
        return await this.purchaseInvoiceModel.findOneAndUpdate({ purchaseInvoiceNumber }, data, { new: true }).exec();
    }


    async deleteInvoice(purchaseInvoiceNumber: string) {
        return await this.purchaseInvoiceModel.findOneAndDelete({ purchaseInvoiceNumber }).exec();
    }


}
