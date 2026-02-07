import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseReturnController } from './purchase-return.controller';

describe('PurchaseReturnController', () => {
  let controller: PurchaseReturnController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseReturnController],
    }).compile();

    controller = module.get<PurchaseReturnController>(PurchaseReturnController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
