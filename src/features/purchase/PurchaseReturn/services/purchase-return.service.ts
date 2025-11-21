/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PurchaseReturn } from '../entities/PurchaseReturn.entity';
import { Model } from 'mongoose';
import { CreatePurchaseReturnDto } from '../dtos/CreatePurchaseReturn.dto';

@Injectable()
export class PurchaseReturnService {



    constructor(@InjectModel('PurchaseReturn') private readonly purchaseReturnModel: Model<PurchaseReturn>) { }


    async findAll(): Promise<PurchaseReturn[]> {
        return await this.purchaseReturnModel.find();
    }

    // Find by returnNumber or by _id if needed
    async findById(idOrReturnNumber: string): Promise<PurchaseReturn | null> {
        // Try by returnNumber first
        const byReturn = await this.purchaseReturnModel.findOne({ returnNumber: idOrReturnNumber });
        if (byReturn) return byReturn;
        // Fallback to findById
        return await this.purchaseReturnModel.findById(idOrReturnNumber);
    }

    async createInvoice(data: CreatePurchaseReturnDto): Promise<PurchaseReturn> {
        // Normalize supplier fields: ensure supplier is a string (name) and supplierId is set if provided
        const payload: any = { ...data };
        if (payload.supplier && typeof payload.supplier !== 'string') {
            // try to extract name
            if (Array.isArray(payload.supplier) && payload.supplier.length > 0) {
                payload.supplier = payload.supplier[0].name ?? String(payload.supplier[0]);
            } else if (typeof payload.supplier === 'object') {
                payload.supplier = payload.supplier.name ?? String(payload.supplier);
            } else {
                payload.supplier = String(payload.supplier);
            }
        }
        if (!payload.supplier && payload.supplierId) {
            // optionally we could lookup supplier name here; leave as supplierId for frontend to resolve
        }

        return await this.purchaseReturnModel.create(payload)
    }

    async updateInvoice(returnNumber: string, data: CreatePurchaseReturnDto): Promise<PurchaseReturn | null> {
        const payload: any = { ...data };
        if (payload.supplier && typeof payload.supplier !== 'string') {
            if (Array.isArray(payload.supplier) && payload.supplier.length > 0) {
                payload.supplier = payload.supplier[0].name ?? String(payload.supplier[0]);
            } else if (typeof payload.supplier === 'object') {
                payload.supplier = payload.supplier.name ?? String(payload.supplier);
            } else {
                payload.supplier = String(payload.supplier);
            }
        }
        return await this.purchaseReturnModel.findOneAndUpdate({ returnNumber }, payload, { new: true })
    }


    async deleteInvoice(returnNumber: string) {
        return await this.purchaseReturnModel.findOneAndDelete({ returnNumber })
    }

    // Compute next PRET-XXXX return number
    async getNextReturnNumber(): Promise<string> {
        const docs = await this.purchaseReturnModel.find().select('returnNumber').lean();
        const nums = (docs || [])
            .map((d: any) => {
                const match = String(d.returnNumber || '').match(/PRET-(\d{4})/i);
                return match ? parseInt(match[1], 10) : null;
            })
            .filter((n: number | null): n is number => n !== null);
        const max = nums.length > 0 ? Math.max(...nums) : 0;
        const next = max + 1;
        return `PRET-${next.toString().padStart(4, '0')}`;
    }




}
