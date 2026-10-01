import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Customer from '@/models/Customer';
import CustomerLedger from '@/models/CustomerLedger';
import Payment from '@/models/Payment';
import CashShift from '@/models/CashShift';
import { requireAuth } from '@/lib/auth/session';
import { DueCollectionSchema } from '@/lib/validation/schemas';
import { subtractMoney, addMoney } from '@/lib/utils/money';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, 'process_sales');
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    const validated = DueCollectionSchema.parse(body);

    const customer = await Customer.findById(validated.customer);
    if (!customer) {
      return NextResponse.json({ success: false, message: 'কাস্টমার পাওয়া যায়নি' }, { status: 404 });
    }

    const previousDue = customer.currentBalance || 0;
    if (previousDue <= 0 && validated.amount > 0) {
      return NextResponse.json(
        { success: false, message: 'এই কাস্টমারের কোনো বকেয়া বাকি নেই।' },
        { status: 400 }
      );
    }

    if (validated.amount > previousDue) {
      return NextResponse.json(
        { success: false, message: `আদায়ের পরিমাণ বর্তমান বকেয়ার (৳ ${previousDue}) চেয়ে বেশি হতে পারে না।` },
        { status: 400 }
      );
    }

    const newBalance = subtractMoney(previousDue, validated.amount);
    const newTotalPaid = addMoney(customer.totalPaid || 0, validated.amount);

    customer.currentBalance = newBalance;
    customer.totalPaid = newTotalPaid;
    await customer.save();

    const paymentNumber = `CP-${Date.now().toString().slice(-6)}`;

    const paymentDoc = await Payment.create({
      paymentNumber,
      type: 'CUSTOMER_PAYMENT',
      customer: customer._id,
      amount: validated.amount,
      paymentMethod: validated.paymentMethod,
      referenceNumber: validated.referenceNumber,
      date: validated.date,
      notes: validated.notes,
      createdBy: authResult.user._id,
    });

    await CustomerLedger.create({
      customer: customer._id,
      date: validated.date,
      type: 'PAYMENT',
      referenceType: 'Payment',
      referenceId: paymentDoc._id,
      referenceNumber: paymentNumber,
      debit: 0,
      credit: validated.amount, // Payment reduces what customer owes
      balance: newBalance,
      notes: validated.notes || `বাকি আদায় (${validated.paymentMethod})`,
      createdBy: authResult.user._id,
    });

    // Update active cash shift if Cash
    if (validated.paymentMethod === 'CASH') {
      const activeShift = await CashShift.findOne({ status: 'OPEN' });
      if (activeShift) {
        activeShift.cashDueCollections = addMoney(activeShift.cashDueCollections || 0, validated.amount);
        activeShift.expectedCash = addMoney(activeShift.expectedCash || 0, validated.amount);
        await activeShift.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'বাকি সফলভাবে আদায় ও সংরক্ষণ করা হয়েছে।',
      paymentNumber,
      customerName: customer.name,
      previousDue,
      paidAmount: validated.amount,
      currentBalance: newBalance,
    });
  } catch (error: any) {
    console.error('Error in due collection:', error);
    return NextResponse.json({ success: false, message: error.message || 'বাকি আদায় সংরক্ষণে ত্রুটি' }, { status: 400 });
  }
}
