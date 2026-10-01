import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Customer from '@/models/Customer';
import Sale from '@/models/Sale';
import { requireAuth } from '@/lib/auth/session';
import { CustomerSchema } from '@/lib/validation/schemas';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const customer = await Customer.findById(id).lean();
    if (!customer) {
      return NextResponse.json({ success: false, message: 'কাস্টমার পাওয়া যায়নি' }, { status: 404 });
    }

    const recentSales = await Sale.find({ customer: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({ success: true, data: { ...customer, recentSales } });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    return NextResponse.json({ success: false, message: 'তথ্য লোড করা যায়নি' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(req, 'manage_customers');
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const validated = CustomerSchema.parse(body);

    const updated = await Customer.findByIdAndUpdate(
      id,
      { ...validated, customerCode: validated.customerCode.toUpperCase() },
      { new: true }
    );

    return NextResponse.json({ success: true, data: updated, message: 'কাস্টমার তথ্য হালনাগাদ হয়েছে।' });
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ success: false, message: error.message || 'হালনাগাদ ব্যর্থ হয়েছে' }, { status: 400 });
  }
}
