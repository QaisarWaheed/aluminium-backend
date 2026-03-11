/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePurchaseOrderDto } from '../dtos/CreatePurchaseOrder.dto';
import { PurchaseOrder } from '../entity/purchaseOrder.entity';

@Injectable()
export class PurchaseorderService {
  constructor(
    @InjectModel('PurchaseOrder')
    private readonly purchaseOrderModel: Model<PurchaseOrder>,
  ) {}

  async findAll(): Promise<PurchaseOrder[]> {
    return await this.purchaseOrderModel.find();
  }

  async findByPoNumber(poNumber: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderModel.findOne({ poNumber });

    if (!purchaseOrder) {
      throw new NotFoundException(`Purchase Order ${poNumber} not found`);
    }

    return purchaseOrder;
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
      { new: true, runValidators: true },
    );
    if (!result) {
      throw new NotFoundException(`Purchase Order ${poNumber} not found`);
    }
    return result;
  }

  async deleteInvoice(poNumber: string) {
    const result = await this.purchaseOrderModel.findOneAndDelete({ poNumber });
    if (!result) {
      throw new NotFoundException(`Purchase Order ${poNumber} not found`);
    }
    return { message: 'Purchase Order deleted successfully', poNumber };
  }
}
