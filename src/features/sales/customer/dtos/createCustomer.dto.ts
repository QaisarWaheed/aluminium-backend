import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentType } from '../entities/customer.entity';

export class CreateCustomerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  address: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  city: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  openingAmount: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  creditLimit: number;

  @ApiProperty({ enum: PaymentType })
  @IsEnum(PaymentType)
  @IsOptional()
  paymentType: PaymentType;
}
export default CreateCustomerDto;
