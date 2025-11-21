/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Draft } from '../draft.entity';
import { CreateDraftDto, UpdateDraftDto } from '../draft.dto';

@Injectable()
export class DraftService {
    constructor(@InjectModel('Draft') private readonly draftModel: Model<Draft>) { }

    async findAll(userId?: string): Promise<Draft[]> {
        if (userId) return await this.draftModel.find({ userId }).exec();
        return await this.draftModel.find().exec();
    }

    async findById(id: string, userId?: string): Promise<Draft | null> {
        const draft = await this.draftModel.findById(id).exec();
        if (!draft) return null;
        if (userId && String(draft.userId) !== String(userId)) return null;
        return draft;
    }

    async findByKey(key: string, userId?: string): Promise<Draft | null> {
        if (userId) return await this.draftModel.findOne({ key, userId }).exec();
        return await this.draftModel.findOne({ key }).exec();
    }

    async createDraft(data: CreateDraftDto & { userId?: string }): Promise<Draft> {
        return await this.draftModel.create(data);
    }

    async updateDraft(id: string, data: UpdateDraftDto, userId?: string): Promise<Draft | null> {
        try {
            const existing = await this.draftModel.findById(id).exec();
            if (!existing) throw new NotFoundException('Draft not found');
            if (userId && String(existing.userId) !== String(userId)) throw new NotFoundException('Draft not found');
            const updated = await this.draftModel.findByIdAndUpdate(id, data, { new: true }).exec();
            if (!updated) throw new NotFoundException('Draft not found');
            return updated;
        } catch (err) {
            throw err;
        }
    }

    async deleteDraft(id: string, userId?: string) {
        const existing = await this.draftModel.findById(id).exec();
        if (!existing) return null;
        if (userId && String(existing.userId) !== String(userId)) return null;
        return await this.draftModel.findByIdAndDelete(id).exec();
    }
}
