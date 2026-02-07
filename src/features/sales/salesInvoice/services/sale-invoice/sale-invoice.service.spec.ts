import { Test, TestingModule } from '@nestjs/testing';
import { SaleInvoiceService } from './sale-invoice.service';

describe('SaleInvoiceService', () => {
  let service: SaleInvoiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaleInvoiceService],
    }).compile();

    service = module.get<SaleInvoiceService>(SaleInvoiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
