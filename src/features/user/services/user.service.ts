import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from '../dtos/create-user-dto';

@Injectable()
export class UserService {

    constructor(@InjectModel('User') private userModel: Model<User>) { }



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

    async login(email: string, password: string): Promise<{ success: boolean; user?: Omit<User, 'password'>; message?: string }> {
        // Check hardcoded credentials first
        if (email === 'hassansaleem@gmail.com' && password === 'hassansaleem#123') {
            return {
                success: true,
                user: {
                    _id: new Types.ObjectId(),
                    name: 'Hassan Saleem',
                    email: 'hassansaleem@gmail.com',
                    CreatedAt: new Date(),
                    UpdatedAt: new Date(),
                } as any
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
        const { password: _, ...userWithoutPassword } = user.toObject();
        return { success: true, user: userWithoutPassword };
    }


    async updateUser(userId: string, updateData: Partial<CreateUserDto>): Promise<CreateUserDto | null> {
        return this.userModel.findByIdAndUpdate(userId, updateData, { new: true }).exec();
    }


    async deleteUser(userId: string): Promise<CreateUserDto | null> {
        return this.userModel.findByIdAndDelete(userId).exec();

    }
}