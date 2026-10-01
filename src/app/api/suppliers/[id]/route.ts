import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Supplier from '@/models/Supplier';
import Purchase from '@/models/Purchase';
import { requireAuth } from '@/lib/auth/session';
import { SupplierSchema } from '@/lib/validation/schemas';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const supplier = await Supplier.findById(id).lean();
    if (!supplier) {
      return NextResponse.json({ success: false, message: 'সাপ্লায়ার পাওয়া যায়নি' }, { status: 404 });
    }

    const recentPurchases = await Purchase.find({ supplier: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({ success: true, data: { ...supplier, recentPurchases } });
  } catch (error) {
    console.error('Error fetching supplier details:', error);
    return NextResponse.json({ success: false, message: 'তথ্য লোড করা যায়নি' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(req, 'manage_suppliers');
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const validated = SupplierSchema.parse(body);

    const updated = await Supplier.findByIdAndUpdate(
      id,
      { ...validated, supplierCode: validated.supplierCode.toUpperCase() },
      { new: true }
    );

    return NextResponse.json({ success: true, data: updated, message: 'সাপ্লায়ার তথ্য হালনাগাদ হয়েছে।' });
  } catch (error: any) {
    console.error('Error updating supplier:', error);
    return NextResponse.json({ success: false, message: error.message || 'হালনাগাদ ব্যর্থ হয়েছে' }, { status: 400 });
  }
}
