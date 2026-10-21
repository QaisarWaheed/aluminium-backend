import { Test, TestingModule } from '@nestjs/testing';
import { SaleInvoiceController } from './sale-invoice.controller';

describe('SaleInvoiceController', () => {
  let controller: SaleInvoiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SaleInvoiceController],
    }).compile();

    controller = module.get<SaleInvoiceController>(SaleInvoiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
