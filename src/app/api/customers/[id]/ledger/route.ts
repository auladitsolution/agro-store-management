import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import CustomerLedger from '@/models/CustomerLedger';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const ledger = await CustomerLedger.find({ customer: id })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: ledger });
  } catch (error) {
    console.error('Error fetching customer ledger:', error);
    return NextResponse.json({ success: false, message: 'লেজার লোড করা যায়নি' }, { status: 500 });
  }
}
