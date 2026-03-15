import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { CreateUserDto } from '../dtos/create-user-dto';
import type { Role } from '../enums/role.enum';
import { UserService } from '../services/user.service';

const ADMIN_ROLE = 'ADMIN' as Role;

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  @Roles(ADMIN_ROLE)
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Post('login')
  @Public()
  async login(@Body() loginDto: { email: string; password: string }) {
    return this.userService.login(loginDto.email, loginDto.password);
  }

  @Get('email/:email')
  async getUserByEmail(@Param('email') email: string) {
    return this.userService.getUserByEmail(email);
  }

  @Get('all')
  @Roles(ADMIN_ROLE)
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Put('update/:id')
  @Roles(ADMIN_ROLE)
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateUserDto>,
  ) {
    return this.userService.updateUser(id, updateData);
  }

  @Delete('delete/:id')
  @Roles(ADMIN_ROLE)
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
