import { Test, TestingModule } from '@nestjs/testing';
import { SalesReturnService } from './sale-retrun.service';

describe('SalesReturnService', () => {
  let service: SalesReturnService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesReturnService],
    }).compile();

    service = module.get<SalesReturnService>(SalesReturnService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
