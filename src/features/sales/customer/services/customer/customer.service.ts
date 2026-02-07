/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCustomerDto } from '../../dtos/createCustomer.dto';
import { Customer } from '../../interfaces/customer.interface';


@Injectable()
export class CustomerService {
  constructor(
    @InjectModel('Customer') private readonly customerModel: Model<Customer>
  ) { }

  async findAll(): Promise<Customer[]> {
    return await this.customerModel.find().exec();
  }

  async findById(id: string): Promise<Customer | null> {
    return await this.customerModel.findById(id).exec();
  }

  async addCustomer(data: CreateCustomerDto): Promise<Customer> {
    return await this.customerModel.create(data);
  }

  async updateCustomer(id: string, data: Partial<CreateCustomerDto>): Promise<Customer | null> {
    return await this.customerModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteCustomer(id: string): Promise<Customer | null> {
    return await this.customerModel.findByIdAndDelete(id).exec();
  }
}
