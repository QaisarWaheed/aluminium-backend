import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from '../dtos/create-user-dto';
import { Role } from '../enums/role.enum';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const DEFAULT_ROLE = 'CASHIER' as Role;
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const ADMIN_ROLE = 'ADMIN' as Role;

const PASSWORD_SALT_ROUNDS = 12;

type BcryptModule = {
  hash(data: string | Buffer, saltOrRounds: string | number): Promise<string>;
  compare(data: string | Buffer, encrypted: string): Promise<boolean>;
};

async function loadBcrypt(): Promise<BcryptModule> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('bcrypt') as BcryptModule;
}

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
    const bcrypt = await loadBcrypt();
    const hashedPassword: string = await bcrypt.hash(
      userData.password,
      PASSWORD_SALT_ROUNDS,
    );

    const newUser = await this.userModel.create({
      ...userData,
      password: hashedPassword,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      role: userData.role ?? DEFAULT_ROLE,
    });
    return newUser;
  }

  async ensureBootstrapAdmin(adminData: {
    name: string;
    email: string;
    password: string;
  }): Promise<boolean> {
    const userCount = await this.userModel.countDocuments().exec();

    if (userCount > 0) {
      return false;
    }

    await this.createUser({
      ...adminData,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      role: ADMIN_ROLE,
    });

    return true;
  }

  async login(
    email: string,
    password: string,
  ): Promise<{
    success: boolean;
    user?: {
      _id: string;
      name: string;
      email: string;
      role: Role;
      CreatedAt?: Date;
      UpdatedAt?: Date;
    };
    message?: string;
  }> {
    const user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const bcrypt = await loadBcrypt();
    const isPasswordValid: boolean = await bcrypt.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      return { success: false, message: 'Invalid password' };
    }

    // Don't send password back
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user.toObject();
    return {
      success: true,
      user: {
        ...userWithoutPassword,
        _id: userWithoutPassword._id.toString(),
      },
    };
  }

  async updateUser(
    userId: string,
    updateData: Partial<CreateUserDto>,
  ): Promise<CreateUserDto | null> {
    const nextUpdateData = { ...updateData };

    if (nextUpdateData.password) {
      const bcrypt = await loadBcrypt();
      nextUpdateData.password = await bcrypt.hash(
        nextUpdateData.password,
        PASSWORD_SALT_ROUNDS,
      );
    }

    return this.userModel
      .findByIdAndUpdate(userId, nextUpdateData, { new: true })
      .exec();
  }

  async deleteUser(userId: string): Promise<CreateUserDto | null> {
    return this.userModel.findByIdAndDelete(userId).exec();
  }
}
