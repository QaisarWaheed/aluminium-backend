/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { ProductsModule } from './features/products/products.module';
import { UserModule } from './features/user/user.module';
import { AuthModule } from './features/auth/auth.module';
import { PurchaseModule } from './features/purchase/purchase.module';
import { SalesModule } from './features/sales/sales.module';
import { ExpenseModule } from './features/expenses/expense.module';
import { AccountsModule } from './features/Accounts/accounts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),

    // ✅ Correct non-SRV Atlas connection
    MongooseModule.forRoot(
      'mongodb+srv://wasifzahoor296_db_user:nukebugs123@cluster0.k1szlzx.mongodb.net/?appName=Cluster0',
      {
        retryAttempts: 5,
        retryDelay: 1000,
      },
    ),

    UserModule,
    AuthModule,
    ProductsModule,
    PurchaseModule,
    SalesModule,
    ExpenseModule,
    AccountsModule,
  ],

  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
//test
