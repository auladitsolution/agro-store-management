import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Supplier from '@/models/Supplier';
import SupplierLedger from '@/models/SupplierLedger';
import { requireAuth } from '@/lib/auth/session';
import { SupplierSchema } from '@/lib/validation/schemas';
import { formatDateBD } from '@/lib/utils/date';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const query: any = { active: true };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { supplierCode: { $regex: search, $options: 'i' } },
      ];
    }

    const suppliers = await Supplier.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ success: false, message: 'সাপ্লায়ার তালিকা লোড করা যায়নি' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, 'manage_suppliers');
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    const validated = SupplierSchema.parse(body);

    const existing = await Supplier.findOne({
      $or: [{ supplierCode: validated.supplierCode.toUpperCase() }, { phone: validated.phone }],
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'এই সাপ্লায়ার কোড বা ফোন নম্বর ইতিমধ্যে ব্যবহৃত।' },
        { status: 400 }
      );
    }

    const supplier = await Supplier.create({
      ...validated,
      supplierCode: validated.supplierCode.toUpperCase(),
      currentBalance: validated.openingBalance || 0,
    });

    if (validated.openingBalance && validated.openingBalance !== 0) {
      await SupplierLedger.create({
        supplier: supplier._id,
        date: formatDateBD(new Date()),
        type: 'OPENING_BALANCE',
        referenceType: 'Manual',
        debit: validated.openingBalance < 0 ? Math.abs(validated.openingBalance) : 0,
        credit: validated.openingBalance > 0 ? validated.openingBalance : 0,
        balance: validated.openingBalance,
        notes: 'প্রারম্ভিক ব্যালেন্স',
        createdBy: authResult.user._id,
      });
    }

    return NextResponse.json({ success: true, data: supplier, message: 'সাপ্লায়ার সফলভাবে যুক্ত হয়েছে।' });
  } catch (error: any) {
    console.error('Error creating supplier:', error);
    return NextResponse.json({ success: false, message: error.message || 'সাপ্লায়ার তৈরিতে সমস্যা হয়েছে' }, { status: 400 });
  }
}
