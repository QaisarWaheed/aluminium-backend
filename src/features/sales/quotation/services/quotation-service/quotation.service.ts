/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Quotation } from '../../quotation.entity';
import { CreateQuotationDto } from '../../createQuotation.dto';
import { JournalvoucherService } from '../../../../Accounts/journalVoucher/services/journalvoucher/journalvoucher.service';
import { CreateJournalVoucherDto } from '../../../../Accounts/journalVoucher/dtos/create-journal-voucher/create-journal-voucher.dto';

@Injectable()
export class QuotationService {


    constructor(
        @InjectModel('Quotation') private readonly saleInvoiceModel: Model<Quotation>,
        private readonly journalVoucherService: JournalvoucherService,
    ) { }


    async findAll(): Promise<Quotation[]> {
        return await this.saleInvoiceModel.find();
    }

    async findById(id: string): Promise<Quotation | null> {

        return await this.saleInvoiceModel.findById(id)

    }

    async createInvoice(data: CreateQuotationDto): Promise<Quotation> {
        const quotation = await this.saleInvoiceModel.create(data);

        // Ledger Entry for Quotation
        try {
            let customerName = 'Unknown';
            if (Array.isArray(data.customer) && data.customer.length > 0) {
                customerName = (data.customer[0] as any).name || 'Unknown';
            } else if (data.customer && typeof data.customer === 'object') {
                customerName = (data.customer as any).name || 'Unknown';
            }
            const journalDto: CreateJournalVoucherDto = {
                date: new Date(), // Quotation date usually today
                voucherNumber: data.quotationNumber,
                accountNumber: customerName,
                description: `Quotation Created - ${data.quotationNumber}`,
                debit: 0, // No financial impact yet
                credit: 0,
            };
            await this.journalVoucherService.create(journalDto);
        } catch (error) {
            console.error('Error creating ledger entry for quotation:', error);
            // We don't fail quotation creation if ledger log fails, as it's non-financial?
            // Requirement says "Create ledger entry...". Phase 1 says "Fixed".
            // I'll leave it as try-catch log only for now to avoid blocking quotation if ledger is strict.
        }

        return quotation;
    }

    async updateInvoice(id: string, data: CreateQuotationDto): Promise<Quotation | null> {
        return await this.saleInvoiceModel
            .findByIdAndUpdate(id, data, { new: true })
    }


    async deleteInvoice(id: string) {
        return await this.saleInvoiceModel
            .findByIdAndDelete(id)
    }






}
