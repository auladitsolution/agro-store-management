import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import CashShift from '@/models/CashShift';
import { requireAuth } from '@/lib/auth/session';
import { addMoney, subtractMoney } from '@/lib/utils/money';

export async function GET() {
  try {
    await connectDB();
    const activeShift = await CashShift.findOne({ status: 'OPEN' }).lean();
    const pastShifts = await CashShift.find({ status: 'CLOSED' })
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    return NextResponse.json({
      success: true,
      activeShift: activeShift || null,
      pastShifts,
    });
  } catch (error) {
    console.error('Error fetching cash shifts:', error);
    return NextResponse.json({ success: false, message: 'ক্যাশ রেজিস্টার লোড করা যায়নি' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, 'manage_cash_register');
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    const { action } = body;

    if (action === 'OPEN') {
      const existingOpen = await CashShift.findOne({ status: 'OPEN' });
      if (existingOpen) {
        return NextResponse.json(
          { success: false, message: 'ইতিমধ্যে একটি ক্যাশ রেজিস্টার শিফট চালু রয়েছে।' },
          { status: 400 }
        );
      }

      const openingCash = Number(body.openingCash) || 0;
      const shift = await CashShift.create({
        shiftDate: new Date().toISOString().split('T')[0],
        openedAt: new Date().toISOString(),
        openedBy: authResult.user.name,
        openingCash,
        expectedCash: openingCash,
        notes: body.notes,
        status: 'OPEN',
      });

      return NextResponse.json({ success: true, message: 'দিনের ক্যাশ শিফট চালু হয়েছে।', data: shift });
    } else if (action === 'CLOSE') {
      const activeShift = await CashShift.findOne({ status: 'OPEN' });
      if (!activeShift) {
        return NextResponse.json({ success: false, message: 'কোনো খোলা ক্যাশ শিফট পাওয়া যায়নি।' }, { status: 400 });
      }

      const actualCash = Number(body.actualCash) || 0;
      const difference = subtractMoney(actualCash, activeShift.expectedCash);

      activeShift.closedAt = new Date().toISOString();
      activeShift.closedBy = authResult.user.name;
      activeShift.actualCash = actualCash;
      activeShift.difference = difference;
      activeShift.status = 'CLOSED';
      activeShift.notes = body.notes ? `${activeShift.notes || ''} | ক্লোজিং: ${body.notes}` : activeShift.notes;

      await activeShift.save();

      return NextResponse.json({
        success: true,
        message: 'ক্যাশ রেজিস্টার সফলভাবে ক্লোজ করা হয়েছে।',
        data: activeShift,
      });
    }

    return NextResponse.json({ success: false, message: 'অবৈধ একশন' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in cash shift route:', error);
    return NextResponse.json({ success: false, message: error.message || 'ক্যাশ শিফট প্রসেসিং ব্যর্থ' }, { status: 400 });
  }
}
