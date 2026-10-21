import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseorderService } from './purchaseorder.service';

describe('PurchaseorderService', () => {
  let service: PurchaseorderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseorderService],
    }).compile();

    service = module.get<PurchaseorderService>(PurchaseorderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
