/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { ProductsModule } from './features/products/products.module';
import { UserModule } from './features/user/user.module';
import { AuthModule } from './features/auth/auth.module';
import { PurchaseModule } from './features/purchase/purchase.module';
import { SalesModule } from './features/sales/sales.module';
import { ExpenseModule } from './features/expenses/expense.module';
import { AccountsModule } from './features/Accounts/accounts.module';
import { SessionModule } from './features/session/session.module';
import { validateEnvironment } from './config/env.validation';
import { JwtAuthGuard } from './features/auth/jwt-auth.guard';
import { RolesGuard } from './features/auth/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'test',
      validate: validateEnvironment,
    }),

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGO_URI'),
        retryAttempts: 5,
        retryDelay: 1000,
      }),
    }),

    UserModule,
    AuthModule,
    ProductsModule,
    PurchaseModule,
    SalesModule,
    ExpenseModule,
    AccountsModule,
    SessionModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
