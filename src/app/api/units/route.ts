import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Unit from '@/models/Unit';
import { requireAuth } from '@/lib/auth/session';
import { UnitSchema } from '@/lib/validation/schemas';
import { STANDARD_UNITS } from '@/lib/utils/units';

export async function GET() {
  try {
    await connectDB();
    let units = await Unit.find().sort({ code: 1 }).lean();
    if (!units || units.length === 0) {
      // Seed default units if database is fresh
      const defaultUnits = STANDARD_UNITS.map((u) => ({
        code: u.code,
        nameBn: u.nameBn,
        nameEn: u.nameEn,
        isBaseUnit: u.code === 'kg' || u.code === 'liter' || u.code === 'piece',
        baseUnit: u.baseUnit,
        conversionFactor: u.defaultConversionFactor,
      }));
      units = (await Unit.insertMany(defaultUnits)) as any;
    }
    return NextResponse.json({ success: true, data: units });
  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json({ success: false, message: 'ইউনিট লোড করা যায়নি' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, 'manage_products');
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    const validated = UnitSchema.parse(body);

    const unit = await Unit.create(validated);
    return NextResponse.json({ success: true, data: unit, message: 'নতুন ইউনিট সংরক্ষিত হয়েছে' });
  } catch (error: any) {
    console.error('Error creating unit:', error);
    return NextResponse.json({ success: false, message: error.message || 'ইউনিট যোগ ব্যর্থ হয়েছে' }, { status: 400 });
  }
}
