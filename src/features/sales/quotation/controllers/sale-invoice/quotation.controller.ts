import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { QuotationService} from '../../services/quotation-service/quotation.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateQuotationDto } from '../../createQuotation.dto';

@Controller('quotation')
export class QuotationController {


constructor(private readonly quotationService : QuotationService){}


@Get()
async findAll(){
    return await this.quotationService.findAll()
}

@Get('/:id')
async findById(@Param('id') id:string){
    return await this.quotationService.findById(id)
}

@Post()
async createInvoice(@Body() data:CreateQuotationDto){
    return await this.quotationService.createInvoice(data)
}

@Put('/:id')
async updateInvoice(@Param('id') id:string, @Body() data:CreateQuotationDto){
    return await this.quotationService.updateInvoice(id, data)
}

@Delete('/:id')
async deleteInvoice(@Param('id') id:string){
    return await this.quotationService.deleteInvoice(id)
}

}
