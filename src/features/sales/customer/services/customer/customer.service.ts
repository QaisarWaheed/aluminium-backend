/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCustomerDto } from '../../dtos/createCustomer.dto';
import { PaginationDto } from '../../../../../common/dtos/pagination.dto';
import { PaginatedResult } from '../../../../../common/interfaces/paginated-result.interface';
import { Customer } from '../../entities/customer.entity';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel('Customer') private readonly customerModel: Model<Customer>,
  ) {}

  async findAll(
    paginationDto: PaginationDto = { page: 1, limit: 10 },
  ): Promise<PaginatedResult<Customer>> {
    const { page = 1, limit = 10, search } = paginationDto;
    const skip = (page - 1) * limit;
    const trimmedSearch = search?.trim();
    const query = trimmedSearch
      ? {
          $or: [
            { name: { $regex: escapeRegex(trimmedSearch), $options: 'i' } },
            { phone: { $regex: escapeRegex(trimmedSearch), $options: 'i' } },
            { city: { $regex: escapeRegex(trimmedSearch), $options: 'i' } },
            { address: { $regex: escapeRegex(trimmedSearch), $options: 'i' } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.customerModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.customerModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      lastPage: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findById(id: string): Promise<Customer | null> {
    return await this.customerModel.findById(id).exec();
  }

  async addCustomer(data: CreateCustomerDto): Promise<Customer> {
    return await this.customerModel.create(data);
  }

  async updateCustomer(
    id: string,
    data: Partial<CreateCustomerDto>,
  ): Promise<Customer | null> {
    return await this.customerModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
  }

  async deleteCustomer(id: string): Promise<Customer | null> {
    return await this.customerModel.findByIdAndDelete(id).exec();
  }
}
