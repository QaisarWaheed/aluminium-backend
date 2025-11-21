/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePurchaseOrderDto } from '../dtos/CreatePurchaseOrder.dto';
import { PurchaseOrder } from '../entity/purchaseOrder.entity';

@Injectable()
export class PurchaseorderService {
  constructor(@InjectModel('PurchaseOrder') private readonly purchaseOrderModel: Model<PurchaseOrder>) { }


  async findAll(): Promise<PurchaseOrder[]> {
    return await this.purchaseOrderModel.find();
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    return await this.purchaseOrderModel.findById(id);
  }

  async createInvoice(data: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    return await this.purchaseOrderModel.create(data);
  }

  async updatePurchaseOrder(
    poNumber: string,
    data: CreatePurchaseOrderDto,
  ): Promise<PurchaseOrder | null> {
    const result = await this.purchaseOrderModel.findOneAndUpdate(
      { poNumber },
      data,
      { new: true, runValidators: true }
    );
    if (!result) {
      throw new Error(`Purchase Order ${poNumber} not found`);
    }
    return result;
  }

  async deleteInvoice(poNumber: string) {
    const result = await this.purchaseOrderModel.findOneAndDelete({ poNumber });
    if (!result) {
      throw new Error(`Purchase Order ${poNumber} not found`);
    }
    return { message: 'Purchase Order deleted successfully', poNumber };
  }
}
