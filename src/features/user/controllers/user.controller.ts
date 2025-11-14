import { Body, Controller, Delete, Get, Inject, Param, Post, Put } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dtos/create-user-dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('User')
@Controller('user')
export class UserController {


  constructor(@Inject(UserService) private userService: UserService) { }


  @Post('create')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    return this.userService.login(loginDto.email, loginDto.password);
  }

  @Get('email/:email')
  async getUserByEmail(@Param('email') email: string) {

    return this.userService.getUserByEmail(email);
  }


  @Get('all')
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Put('update/:id')
  async updateUser(@Param('id') id: string, @Body() updateData: Partial<CreateUserDto>) {
    return this.userService.updateUser(id, updateData);
  }

  @Delete('delete/:id')
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }


}



