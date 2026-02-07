import { Test, TestingModule } from '@nestjs/testing';
import { JournalvoucherService } from './journalvoucher.service';

describe('JournalvoucherService', () => {
  let service: JournalvoucherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JournalvoucherService],
    }).compile();

    service = module.get<JournalvoucherService>(JournalvoucherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
