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
        const payload = { ...data } as Record<string, unknown>;
        if (payload.supplier && typeof payload.supplier !== 'string') {
            // try to extract name
            const s = payload.supplier as { name?: string } | Array<{ name?: string }>;
            if (Array.isArray(s) && s.length > 0) {
                payload.supplier = s[0].name ?? String(s[0]);
            } else if (!Array.isArray(s) && typeof s === 'object') {
                payload.supplier = s.name ?? String(s);
            } else {
                payload.supplier = String(s);
            }
        }
        if (!payload.supplier && payload.supplierId) {
            // optionally we could lookup supplier name here; leave as supplierId for frontend to resolve
        }

        return await this.purchaseReturnModel.create(payload)
    }

    async updateInvoice(returnNumber: string, data: CreatePurchaseReturnDto): Promise<PurchaseReturn | null> {
        const payload = { ...data } as Record<string, unknown>;
        if (payload.supplier && typeof payload.supplier !== 'string') {
            const s = payload.supplier as { name?: string } | Array<{ name?: string }>;
            if (Array.isArray(s) && s.length > 0) {
                payload.supplier = s[0].name ?? String(s[0]);
            } else if (!Array.isArray(s) && typeof s === 'object') {
                payload.supplier = s.name ?? String(s);
            } else {
                payload.supplier = String(s);
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
            .map((d: PurchaseReturn) => {
                const match = String(d.returnNumber || '').match(/PRET-(\d{4})/i);
                return match ? parseInt(match[1], 10) : null;
            })
            .filter((n: number | null): n is number => n !== null);
        const max = nums.length > 0 ? Math.max(...nums) : 0;
        const next = max + 1;
        return `PRET-${next.toString().padStart(4, '0')}`;
    }




}
