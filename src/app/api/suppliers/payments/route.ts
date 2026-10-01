import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Supplier from '@/models/Supplier';
import SupplierLedger from '@/models/SupplierLedger';
import Payment from '@/models/Payment';
import CashShift from '@/models/CashShift';
import { requireAuth } from '@/lib/auth/session';
import { SupplierPaymentSchema } from '@/lib/validation/schemas';
import { subtractMoney, addMoney } from '@/lib/utils/money';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, 'manage_purchases');
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    const validated = SupplierPaymentSchema.parse(body);

    const supplier = await Supplier.findById(validated.supplier);
    if (!supplier) {
      return NextResponse.json({ success: false, message: 'সাপ্লায়ার পাওয়া যায়নি' }, { status: 404 });
    }

    const previousBalance = supplier.currentBalance || 0;
    const newBalance = subtractMoney(previousBalance, validated.amount);
    const newTotalPaid = addMoney(supplier.totalPaid || 0, validated.amount);

    supplier.currentBalance = newBalance;
    supplier.totalPaid = newTotalPaid;
    await supplier.save();

    const paymentNumber = `SP-${Date.now().toString().slice(-6)}`;

    const paymentDoc = await Payment.create({
      paymentNumber,
      type: 'SUPPLIER_PAYMENT',
      supplier: supplier._id,
      amount: validated.amount,
      paymentMethod: validated.paymentMethod,
      referenceNumber: validated.referenceNumber,
      date: validated.date,
      notes: validated.notes,
      createdBy: authResult.user._id,
    });

    await SupplierLedger.create({
      supplier: supplier._id,
      date: validated.date,
      type: 'PAYMENT',
      referenceType: 'Payment',
      referenceId: paymentDoc._id,
      referenceNumber: paymentNumber,
      debit: validated.amount, // Payment reduces what we owe
      credit: 0,
      balance: newBalance,
      notes: validated.notes || `পেমেন্ট: ${validated.paymentMethod}`,
      createdBy: authResult.user._id,
    });

    // Update active cash shift if Cash
    if (validated.paymentMethod === 'CASH') {
      const activeShift = await CashShift.findOne({ status: 'OPEN' });
      if (activeShift) {
        activeShift.cashSupplierPayments = addMoney(activeShift.cashSupplierPayments || 0, validated.amount);
        activeShift.expectedCash = subtractMoney(activeShift.expectedCash || 0, validated.amount);
        await activeShift.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'সাপ্লায়ার পেমেন্ট সফলভাবে সংরক্ষিত হয়েছে।',
      currentBalance: newBalance,
    });
  } catch (error: any) {
    console.error('Error recording supplier payment:', error);
    return NextResponse.json({ success: false, message: error.message || 'পেমেন্ট সংরক্ষণে ত্রুটি' }, { status: 400 });
  }
}
