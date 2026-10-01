import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Sale from '@/models/Sale';
import BusinessSettings from '@/models/BusinessSettings';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const sale = await Sale.findById(id)
      .populate('customer')
      .populate('salesperson', 'name')
      .lean();

    if (!sale) {
      return NextResponse.json({ success: false, message: 'বিক্রয় চালান পাওয়া যায়নি' }, { status: 404 });
    }

    const settings = await BusinessSettings.findOne().lean();

    return NextResponse.json({ success: true, data: sale, settings });
  } catch (error) {
    console.error('Error fetching sale details:', error);
    return NextResponse.json({ success: false, message: 'তথ্য লোড করা যায়নি' }, { status: 500 });
  }
}
