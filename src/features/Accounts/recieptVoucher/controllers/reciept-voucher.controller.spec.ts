import { Test, TestingModule } from '@nestjs/testing';
import { RecieptVoucherController } from './reciept-voucher.controller';

describe('RecieptVoucherController', () => {
  let controller: RecieptVoucherController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecieptVoucherController],
    }).compile();

    controller = module.get<RecieptVoucherController>(RecieptVoucherController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
