import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseReturnService } from './purchase-return.service';

describe('PurchaseReturnService', () => {
  let service: PurchaseReturnService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseReturnService],
    }).compile();

    service = module.get<PurchaseReturnService>(PurchaseReturnService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
