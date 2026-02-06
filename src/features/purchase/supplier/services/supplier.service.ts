import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Supplier } from '../supplier.entity';
import { CreateSupplierDto } from '../supplier.dto';

@Injectable()
export class SupplierService {
  constructor(
    @InjectModel('Supplier') private readonly supplierModel: Model<Supplier>,
  ) {}

  async findAll(): Promise<Supplier[]> {
    return await this.supplierModel.find();
  }

  async findById(id: string): Promise<Supplier | null> {
    const supplier = await await this.supplierModel.findById(id);
    if (!supplier) {
      throw new NotFoundException('No Supplier Found!!!');
    }
    return supplier;
  }

  async create(data: CreateSupplierDto): Promise<Supplier | null> {
    const newSupplier = await this.supplierModel.create(data);
    return newSupplier;
  }

  async updateSupplier(
    id: string,
    data: Partial<CreateSupplierDto>,
  ): Promise<Supplier> {
    const updatedSupplier = await this.supplierModel.findByIdAndUpdate(
      id,
      data,
      { new: true },
    );
    if (!updatedSupplier) {
      throw new NotFoundException('no supplier found');
    }
    return updatedSupplier;
  }

  async deleteSupplier(id: string) {
    const deleted = await this.supplierModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundException('No Supplier Found against this Id');
    }
  }
}
