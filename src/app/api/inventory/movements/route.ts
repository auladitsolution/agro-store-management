import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import StockMovement from '@/models/StockMovement';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('product');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const query: any = {};
    if (productId) query.product = productId;
    if (type) query.type = type;

    const movements = await StockMovement.find(query)
      .populate('product', 'nameBn nameEn productCode unit')
      .populate('batch', 'batchNumber')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, data: movements });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return NextResponse.json({ success: false, message: 'স্টক মুভমেন্ট লোড করা যায়নি' }, { status: 500 });
  }
}
