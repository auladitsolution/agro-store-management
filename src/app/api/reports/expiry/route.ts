import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Batch from '@/models/Batch';
import { evaluateBatchExpiry } from '@/lib/utils/fefo';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || '60'; // 'expired', '30', '60', '90', 'all'

    const todayStr = new Date().toISOString().split('T')[0];
    const query: any = { remainingQuantity: { $gt: 0 }, expiryDate: { $exists: true, $ne: '' } };

    if (filter === 'expired') {
      query.expiryDate = { $lt: todayStr };
    } else if (filter === '30' || filter === '60' || filter === '90') {
      const days = parseInt(filter, 10);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      query.expiryDate = { $lte: targetDate.toISOString().split('T')[0], $gte: todayStr };
    }

    const batches = await Batch.find(query)
      .populate('product', 'nameBn nameEn productCode unit')
      .populate('supplier', 'name company phone')
      .sort({ expiryDate: 1 })
      .lean();

    const analyzed = batches.map((b: any) => {
      const analysis = evaluateBatchExpiry(b);
      return {
        ...b,
        status: analysis.status,
        daysRemaining: analysis.daysRemaining,
        statusLabelBn: analysis.statusLabelBn,
      };
    });

    return NextResponse.json({ success: true, data: analyzed });
  } catch (error) {
    console.error('Error fetching expiry report:', error);
    return NextResponse.json({ success: false, message: 'মেয়াদোত্তীর্ণ রিপোর্ট লোড করা যায়নি' }, { status: 500 });
  }
}
