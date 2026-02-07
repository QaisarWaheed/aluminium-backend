/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { SalesReturn } from '../../salesReturn.entity';
import { CreateSalesReturnDto } from '../../salesReturn.dto';

@Injectable()
export class SalesReturnService {
  constructor(
    @InjectModel('SalesReturn')
    private readonly salesReturnModel: Model<SalesReturn>,
  ) { }

  async findAll(): Promise<SalesReturn[]> {
    return await this.salesReturnModel.find();
  }



  async findByInvoiceNumber(invoiceNumber: string): Promise<SalesReturn | null> {

    return await this.salesReturnModel.findOne({ invoiceNumber: invoiceNumber }).exec();
  }

  async createInvoice(data: CreateSalesReturnDto): Promise<SalesReturn> {
    return await this.salesReturnModel.create(data);
  }

  async updateInvoice(
    id: string,
    data: CreateSalesReturnDto,
  ): Promise<SalesReturn | null> {
    // invoiceNumber on SalesReturn is stored as a number

    return await this.salesReturnModel.findOneAndUpdate({ invoiceNumber: id }, data, {
      new: true,
    }).exec();
  }

  async deleteInvoice(id: string) {

    return await this.salesReturnModel.findOneAndDelete({ invoiceNumber: id }).exec();
  }
}
