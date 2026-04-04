/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { SalesReturnController } from '../../../salesReturn/controllers/sale-invoice/sale-return.controller';
import { SalesReturnService } from '../../../salesReturn/services/sale-invoice/sale-return.service';
import { Product } from '../../../../products/entities/Product.entity';
import { StockLedger } from '../../../../products/entities/StockLedger.entity';

describe('SalesReturnController', () => {
  let controller: SalesReturnController;

  const mockSession = {
    withTransaction: jest.fn(async (work: () => Promise<unknown>) => work()),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };

  const mockConnection = {
    startSession: jest.fn().mockResolvedValue(mockSession),
  };

  const mockModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    create: jest.fn(),
  };

  const mockSalesReturnService = {
    findAll: jest.fn(),
    findByInvoiceNumber: jest.fn(),
    createInvoice: jest.fn(),
    updateInvoice: jest.fn(),
    deleteInvoice: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesReturnController],
      providers: [
        {
          provide: SalesReturnService,
          useValue: mockSalesReturnService,
        },
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
        {
          provide: getModelToken('SalesReturn'),
          useValue: mockModel,
        },
        {
          provide: getModelToken(Product.name),
          useValue: mockModel,
        },
        {
          provide: getModelToken(StockLedger.name),
          useValue: mockModel,
        },
        {
          provide: getModelToken('SalesInvoice'),
          useValue: mockModel,
        },
      ],
    }).compile();

    controller = module.get<SalesReturnController>(SalesReturnController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
