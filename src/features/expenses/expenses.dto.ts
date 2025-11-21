/* eslint-disable prettier/prettier */
import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import type { paymentMethodType } from "../sales/salesInvoice/salesinvoice.entity";


export class CreateExpensesDto {


    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsString()
    expenseNumber: string;

    @ApiProperty({ required: true })
    @IsNotEmpty()
    date: Date;

    @ApiProperty({ required: true })
    @IsString()
    @IsOptional()
    description: string;

    @ApiProperty({ required: true })
    @IsNumber()
    amount: number;

    @ApiProperty({ enum: ['Cash', 'Card'], required: false })
    @IsOptional()
    @IsIn(['Cash', 'Card'])
    paymentMethod: paymentMethodType;

    @ApiProperty({ required: false })
    @IsOptional()
    reference: string;

    @ApiProperty({ required: false })
    @IsOptional()
    remarks: string;

    @ApiProperty({ required: false })
    @IsOptional()
    categoryType: string;



}