import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from '../dtos/create-user-dto';

@Injectable()
export class UserService {
  constructor(@InjectModel('User') private userModel: Model<User>) {}

  async getAllUsers(): Promise<User[] | null> {
    return this.userModel.find().exec();
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    const newUser = await this.userModel.create(userData);
    return newUser;
  }

  async login(
    email: string,
    password: string,
  ): Promise<{
    success: boolean;
    user?: { _id: string; name: string; email: string; CreatedAt?: Date; UpdatedAt?: Date };
    message?: string;
  }> {
    // Check hardcoded credentials first
    if (email === 'hassansaleem@gmail.com' && password === 'hassansaleem#123') {
      return {
        success: true,
        user: {
          _id: new Types.ObjectId().toString(),
          name: 'Hassan Saleem',
          email: 'hassansaleem@gmail.com',
          CreatedAt: new Date(),
          UpdatedAt: new Date(),
        },
      };
    }

    // Check database for other users
    const user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Simple password comparison (in production, use bcrypt)
    if (user.password !== password) {
      return { success: false, message: 'Invalid password' };
    }

    // Don't send password back
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user.toObject();
    return { 
      success: true, 
      user: { 
        ...userWithoutPassword, 
        _id: userWithoutPassword._id.toString() 
      } 
    };
  }

  async updateUser(
    userId: string,
    updateData: Partial<CreateUserDto>,
  ): Promise<CreateUserDto | null> {
    return this.userModel
      .findByIdAndUpdate(userId, updateData, { new: true })
      .exec();
  }

  async deleteUser(userId: string): Promise<CreateUserDto | null> {
    return this.userModel.findByIdAndDelete(userId).exec();
  }
}
