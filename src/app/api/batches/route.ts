import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Batch from '@/models/Batch';
import { sortBatchesFEFO } from '@/lib/utils/fefo';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('product');
    const filterExpired = searchParams.get('filterExpired') === 'true';

    const query: any = {};
    if (productId) {
      query.product = productId;
    }

    const batches = await Batch.find(query)
      .populate('product', 'nameBn nameEn productCode unit')
      .populate('supplier', 'name company')
      .lean();

    const sorted = sortBatchesFEFO(batches as any, { filterExpired });

    return NextResponse.json({ success: true, data: sorted });
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json({ success: false, message: 'ব্যাচ লোড করা যায়নি' }, { status: 500 });
  }
}
