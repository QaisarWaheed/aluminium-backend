import { Test, TestingModule } from '@nestjs/testing';
import { RecieptVoucherService } from './reciept-voucher.service';

describe('RecieptVoucherService', () => {
  let service: RecieptVoucherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecieptVoucherService],
    }).compile();

    service = module.get<RecieptVoucherService>(RecieptVoucherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
