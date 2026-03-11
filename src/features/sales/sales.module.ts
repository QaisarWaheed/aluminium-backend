import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import salesInvoiceSchema from './salesInvoice/salesinvoice.entity';
import salesReturnSchema from './salesReturn/salesReturn.entity';
import { SaleInvoiceController } from './salesInvoice/controllers/sale-invoice/sale-invoice.controller';
import { SaleInvoiceService } from './salesInvoice/services/sale-invoice/sale-invoice.service';
import { SalesReturnController } from './salesReturn/controllers/sale-invoice/sale-return.controller';
import { SalesReturnService } from './salesReturn/services/sale-invoice/sale-return.service';
import { CustomerController } from './customer/controllers/customer/customer.controller';
import { CustomerService } from './customer/services/customer/customer.service';
import customerSchema from './customer/entities/customer.entity';
import quotationSchema from './quotation/quotation.entity';
import { QuotationController } from './quotation/controllers/sale-invoice/quotation.controller';
import { QuotationService } from './quotation/services/quotation-service/quotation.service';
import draftSchema from './draft/draft.entity';
import { DraftController } from './draft/controllers/draft/draft.controller';
import { DraftService } from './draft/services/draft.service';
import { ProductsModule } from '../products/products.module';
import { SessionModule } from '../session/session.module';

import { JournalVoucher } from '../Accounts/journalVoucher/journalVoucher';

@Module({
  imports: [
    JournalVoucher,
    ProductsModule, // Import ProductsModule for stock management
    SessionModule,
    MongooseModule.forFeature([
      { name: 'SalesInvoice', schema: salesInvoiceSchema },
      { name: 'SalesReturn', schema: salesReturnSchema },
      { name: 'Customer', schema: customerSchema },
      { name: 'Quotation', schema: quotationSchema },
      { name: 'Draft', schema: draftSchema },
    ]),
  ],
  controllers: [
    SaleInvoiceController,
    SalesReturnController,
    CustomerController,
    QuotationController,
    DraftController,
  ],
  providers: [
    SaleInvoiceService,
    SalesReturnService,
    CustomerService,
    QuotationService,
    DraftService,
  ],
})
export class SalesModule {}
