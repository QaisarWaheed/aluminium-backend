import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import salesInvoiceSchema from '../sales/salesInvoice/salesinvoice.entity';
import { SessionController } from './session.controller';
import { sessionSchema } from './entities/session.entity';
import { SessionService } from './session.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Session', schema: sessionSchema },
      { name: 'SalesInvoice', schema: salesInvoiceSchema },
    ]),
  ],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
