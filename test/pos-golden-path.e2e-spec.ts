import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import {
  StockLedger,
  StockTransactionType,
} from '../src/features/products/entities/StockLedger.entity';
import { Product } from '../src/features/products/entities/Product.entity';
import { Session } from '../src/features/session/entities/session.entity';
import { UserService } from '../src/features/user/services/user.service';

describe('POS golden path (e2e)', () => {
  let app: INestApplication<App>;
  let mongoServer: MongoMemoryReplSet;
  let connection: Connection;
  let productModel: Model<Product>;
  let stockLedgerModel: Model<StockLedger>;
  let sessionModel: Model<Session>;

  const adminEmail = 'admin@example.com';
  const adminPassword = 'Admin123!GoldenPath';

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({
      replSet: { count: 1 },
    });

    process.env.NODE_ENV = 'test';
    process.env.MONGO_URI = mongoServer.getUri('pos-golden-path');
    process.env.MONGODB_URI = process.env.MONGO_URI;
    process.env.JWT_SECRET = 'golden-path-secret';
    process.env.BOOTSTRAP_ADMIN_NAME = 'Admin';
    process.env.BOOTSTRAP_ADMIN_EMAIL = adminEmail;
    process.env.BOOTSTRAP_ADMIN_PASSWORD = adminPassword;
    process.env.ALLOWED_ORIGINS = 'http://localhost:5173';

    const { AppModule } = require('../src/app.module');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    connection = app.get<Connection>(getConnectionToken());
    productModel = app.get<Model<Product>>(getModelToken('Product'));
    stockLedgerModel = app.get<Model<StockLedger>>(
      getModelToken(StockLedger.name),
    );
    sessionModel = app.get<Model<Session>>(getModelToken('Session'));

    const userService = app.get(UserService);
    await userService.ensureBootstrapAdmin({
      name: process.env.BOOTSTRAP_ADMIN_NAME || 'Admin',
      email: adminEmail,
      password: adminPassword,
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }

    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await connection.db.dropDatabase();

    const userService = app.get(UserService);
    await userService.ensureBootstrapAdmin({
      name: process.env.BOOTSTRAP_ADMIN_NAME || 'Admin',
      email: adminEmail,
      password: adminPassword,
    });
  });

  it('requires an open shift before posting a sale and records stock movements once the shift is opened', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(({ status }) => {
        expect([200, 201]).toContain(status);
      });

    const accessToken = loginResponse.body.access_token as string;
    expect(accessToken).toBeTruthy();

    const productResponse = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        itemName: 'Golden Path Panel',
        category: 'Panels',
        unit: 'pcs',
        description: 'Integration test product',
        brand: 'Test Brand',
        variants: [
          {
            thickness: '1.6',
            color: 'Silver',
            salesRate: 125,
            openingStock: 10,
            minimumStockLevel: 1,
          },
        ],
      })
      .expect(201);

    const product = productResponse.body as Product & {
      variants: Array<{ sku: string; availableStock: number }>;
    };
    const variant = product.variants[0];
    expect(variant.sku).toBeTruthy();

    const salePayload = {
      invoiceNumber: 'INV-GOLDEN-0001',
      invoiceDate: new Date().toISOString(),
      paymentMethod: 'Cash',
      items: [
        {
          _id: product._id,
          sku: variant.sku,
          itemName: product.itemName,
          thickness: '1.6',
          color: 'Silver',
          quantity: 2,
          salesRate: 125,
          length: 1,
          discount: 0,
          discountAmount: 0,
          totalGrossAmount: 250,
          totalNetAmount: 250,
          amount: 250,
        },
      ],
      customer: {
        name: 'Golden Path Customer',
        phone: '03001234567',
        address: 'Test Street',
        city: 'Multan',
        openingAmount: 0,
        creditLimit: 0,
        paymentType: 'Debit',
      },
      remarks: 'Golden path integration test',
      length: 1,
      discount: 0,
      subTotal: 250,
      amount: 250,
      totalGrossAmount: 250,
      totalDiscountAmount: 0,
      totalNetAmount: 250,
      receivedAmount: 250,
      pendingAmount: 0,
    };

    await request(app.getHttpServer())
      .post('/sale-invoice')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(salePayload)
      .expect(403)
      .expect(({ body }) => {
        expect(String(body.message)).toContain('Please open a shift first');
      });

    const openShiftResponse = await request(app.getHttpServer())
      .post('/session/open')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ openingBalance: 500 })
      .expect(201);

    expect(openShiftResponse.body.status).toBe('OPEN');

    const createSaleResponse = await request(app.getHttpServer())
      .post('/sale-invoice')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(salePayload)
      .expect(201);

    expect(createSaleResponse.body.invoiceNumber).toBe('INV-GOLDEN-0001');
    expect(createSaleResponse.body.sessionId).toBeTruthy();

    const updatedProduct = await productModel.findById(product._id).lean();
    const updatedVariant = updatedProduct?.variants.find(
      (entry) => entry.sku === variant.sku,
    );

    expect(updatedVariant?.availableStock).toBe(8);

    const stockEntry = await stockLedgerModel
      .findOne({
        sku: variant.sku,
        referenceId: 'INV-GOLDEN-0001',
        transactionType: StockTransactionType.SALE,
      })
      .lean();

    expect(stockEntry).toBeTruthy();
    expect(stockEntry?.quantityChange).toBe(-2);
    expect(stockEntry?.newStock).toBe(8);

    const activeSession = await sessionModel.findOne({ status: 'OPEN' }).lean();
    expect(activeSession?._id).toBeTruthy();

    const closeShiftResponse = await request(app.getHttpServer())
      .post('/session/close')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ closingBalance: 750 })
      .expect(201);

    expect(closeShiftResponse.body.status).toBe('CLOSED');
    expect(closeShiftResponse.body.closingBalance).toBe(750);
  });
});
