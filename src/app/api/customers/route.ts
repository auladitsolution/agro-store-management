import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Customer from '@/models/Customer';
import CustomerLedger from '@/models/CustomerLedger';
import { requireAuth } from '@/lib/auth/session';
import { CustomerSchema } from '@/lib/validation/schemas';
import { formatDateBD } from '@/lib/utils/date';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const hasDue = searchParams.get('hasDue') === 'true';

    const query: any = { active: true };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { customerCode: { $regex: search, $options: 'i' } },
        { village: { $regex: search, $options: 'i' } },
      ];
    }

    if (hasDue) {
      query.currentBalance = { $gt: 0 };
    }

    const customers = await Customer.find(query).sort({ currentBalance: -1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ success: false, message: 'কাস্টমার তালিকা লোড করা যায়নি' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, 'manage_customers');
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    const validated = CustomerSchema.parse(body);

    const existing = await Customer.findOne({
      $or: [{ customerCode: validated.customerCode.toUpperCase() }, { phone: validated.phone }],
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'এই কাস্টমার কোড বা ফোন নম্বর ইতিমধ্যে ব্যবহৃত।' },
        { status: 400 }
      );
    }

    const customer = await Customer.create({
      ...validated,
      customerCode: validated.customerCode.toUpperCase(),
      currentBalance: validated.openingBalance || 0,
    });

    if (validated.openingBalance && validated.openingBalance !== 0) {
      await CustomerLedger.create({
        customer: customer._id,
        date: formatDateBD(new Date()),
        type: 'OPENING_BALANCE',
        referenceType: 'Manual',
        debit: validated.openingBalance > 0 ? validated.openingBalance : 0,
        credit: validated.openingBalance < 0 ? Math.abs(validated.openingBalance) : 0,
        balance: validated.openingBalance,
        notes: 'প্রারম্ভিক বাকি ব্যালেন্স',
        createdBy: authResult.user._id,
      });
    }

    return NextResponse.json({ success: true, data: customer, message: 'কাস্টমার সফলভাবে যুক্ত হয়েছে।' });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ success: false, message: error.message || 'কাস্টমার তৈরিতে সমস্যা হয়েছে' }, { status: 400 });
  }
}
