import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Expense from '@/models/Expense';
import CashShift from '@/models/CashShift';
import { requireAuth } from '@/lib/auth/session';
import { ExpenseSchema } from '@/lib/validation/schemas';
import { addMoney, subtractMoney } from '@/lib/utils/money';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const query: any = {};
    if (category) query.category = category;

    const expenses = await Expense.find(query)
      .populate('createdBy', 'name')
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, data: expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ success: false, message: 'খরচ লোড করা যায়নি' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, 'manage_expenses');
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    const validated = ExpenseSchema.parse(body);

    const expense = await Expense.create({
      ...validated,
      createdBy: authResult.user._id,
    });

    if (validated.paymentMethod === 'CASH') {
      const activeShift = await CashShift.findOne({ status: 'OPEN' });
      if (activeShift) {
        activeShift.cashExpenses = addMoney(activeShift.cashExpenses || 0, validated.amount);
        activeShift.expectedCash = subtractMoney(activeShift.expectedCash || 0, validated.amount);
        await activeShift.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'খরচ সফলভাবে যোগ করা হয়েছে।',
      data: expense,
    });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ success: false, message: error.message || 'খরচ সংরক্ষণে ত্রুটি' }, { status: 400 });
  }
}
