import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SalesInvoice } from '../sales/salesInvoice/salesinvoice.entity';
import { CloseSessionDto } from './dtos/close-session.dto';
import { OpenSessionDto } from './dtos/open-session.dto';
import { Session, SessionStatus } from './entities/session.entity';

export interface ActiveSessionSummary {
  session: Session | null;
  currentSalesTotal: number;
}

@Injectable()
export class SessionService {
  constructor(
    @InjectModel('Session')
    private readonly sessionModel: Model<Session>,
    @InjectModel('SalesInvoice')
    private readonly salesInvoiceModel: Model<SalesInvoice>,
  ) {}

  async findOpenSessionForUser(userId: string): Promise<Session | null> {
    return this.sessionModel
      .findOne({ userId, status: SessionStatus.OPEN })
      .sort({ startTime: -1 })
      .exec();
  }

  async getActiveSessionSummary(userId: string): Promise<ActiveSessionSummary> {
    const session = await this.findOpenSessionForUser(userId);

    if (!session) {
      return {
        session: null,
        currentSalesTotal: 0,
      };
    }

    const sales = await this.salesInvoiceModel
      .find({ sessionId: String(session._id) })
      .select({ totalNetAmount: 1, amount: 1, subTotal: 1 })
      .lean()
      .exec();

    const currentSalesTotal = sales.reduce((sum, sale) => {
      const nextAmount =
        typeof sale.totalNetAmount === 'number'
          ? sale.totalNetAmount
          : typeof sale.amount === 'number'
            ? sale.amount
            : typeof sale.subTotal === 'number'
              ? sale.subTotal
              : 0;

      return sum + nextAmount;
    }, 0);

    return {
      session,
      currentSalesTotal,
    };
  }

  async openSession(userId: string, dto: OpenSessionDto): Promise<Session> {
    const existingSession = await this.findOpenSessionForUser(userId);

    if (existingSession) {
      throw new ConflictException('A shift is already open');
    }

    return this.sessionModel.create({
      userId,
      startTime: new Date(),
      openingBalance: dto.openingBalance,
      status: SessionStatus.OPEN,
    });
  }

  async closeSession(userId: string, dto: CloseSessionDto): Promise<Session> {
    const existingSession = await this.findOpenSessionForUser(userId);

    if (!existingSession) {
      throw new NotFoundException('No open shift found');
    }

    const closedSession = await this.sessionModel
      .findByIdAndUpdate(
        existingSession._id,
        {
          endTime: new Date(),
          closingBalance: dto.closingBalance,
          status: SessionStatus.CLOSED,
        },
        { new: true },
      )
      .exec();

    if (!closedSession) {
      throw new NotFoundException('No open shift found');
    }

    return closedSession;
  }
}
