import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { SupplierSchema } from './supplier/supplier.entity';
import { SupplierController } from './supplier/controllers/supplier.controller';
import { SupplierService } from './supplier/services/supplier.service';
import purchaseInvoiceSchema from './PurchaseInvoice/entities/PurchaseInvoice.entity';
import purchaseReturnSchema from './PurchaseReturn/entities/PurchaseReturn.entity';
import purchaseOrderSchema from './purchaseOrder/entity/purchaseOrder.entity';
import { PurchaseInvoiceController } from './PurchaseInvoice/controllers/purchase-invoice.controller';
import { PurchaseReturnController } from './PurchaseReturn/controllers/purchase-return.controller';
import { PurchaseInvoiceService } from './PurchaseInvoice/services/purchase-invoice.service';
import { PurchaseReturnService } from './PurchaseReturn/services/purchase-return.service';
import { PurchaseorderController } from './purchaseOrder/controllers/purchaseorder.controller';
import { PurchaseorderService } from './purchaseOrder/services/purchaseorder.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Supplier', schema: SupplierSchema },
      { name: 'PurchaseInvoice', schema: purchaseInvoiceSchema },
      { name: 'PurchaseReturn', schema: purchaseReturnSchema },
      { name: 'PurchaseOrder', schema: purchaseOrderSchema },
    ]),
  ],
  controllers: [
    SupplierController,
    PurchaseInvoiceController,
    PurchaseReturnController,
    PurchaseorderController,
  ],
  providers: [
    SupplierService,
    PurchaseInvoiceService,
    PurchaseReturnService,
    PurchaseorderService,
  ],
})
export class PurchaseModule {}
