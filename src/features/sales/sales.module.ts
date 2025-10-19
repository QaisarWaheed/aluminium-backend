import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import salesInvoiceSchema from './salesInvoice/salesinvoice.entity';
import salesReturnSchema from './salesRetum/salesReturn.entity';
import { SaleInvoiceController } from './salesInvoice/controllers/sale-invoice/sale-invoice.controller';
import { SaleInvoiceService } from './salesInvoice/services/sale-invoice/sale-invoice.service';
import { SalesReturnController } from './salesRetum/controllers/sale-invoice/sale-return.controller';
import { SalesReturnService } from './salesRetum/services/sale-invoice/sale-retrun.service';
import { CustomerController } from './customer/controllers/customer/customer.controller';
import { CustomerService } from './customer/services/customer/customer.service';
import customerSchema from './customer/entities/customer.entity';
import quotationSchema, { Quotation } from './quotation/quotation.entity';
import { QuotationController } from './quotation/controllers/sale-invoice/quotation.controller';
import { QuotationService } from './quotation/services/quotation-service/quotation.service';
 
 

@Module({

imports:[MongooseModule.forFeature([{name:'SalesInvoice', schema:salesInvoiceSchema},
    {name:'SalesReturn', schema:salesReturnSchema}, {name:'Customer', schema:customerSchema}, {name:'Quotation', schema:quotationSchema}
])],
controllers:[SaleInvoiceController, SalesReturnController, CustomerController, QuotationController],
providers:[SaleInvoiceService, SalesReturnService, CustomerService, QuotationService]

})
export class SalesModule {}
