import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Purchase from '@/models/Purchase';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const purchase = await Purchase.findById(id)
      .populate('supplier')
      .populate('createdBy', 'name')
      .lean();

    if (!purchase) {
      return NextResponse.json({ success: false, message: 'ক্রয় চালানটি পাওয়া যায়নি' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: purchase });
  } catch (error) {
    console.error('Error fetching purchase details:', error);
    return NextResponse.json({ success: false, message: 'তথ্য লোড করা যায়নি' }, { status: 500 });
  }
}
