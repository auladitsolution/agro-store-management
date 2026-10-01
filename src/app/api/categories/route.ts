import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Category from '@/models/Category';
import { requireAuth } from '@/lib/auth/session';
import { CategorySchema } from '@/lib/validation/schemas';

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find({ active: true }).sort({ sortOrder: 1, nameBn: 1 }).lean();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ success: false, message: 'ক্যাটাগরি লোড করা যায়নি' }, { status: 500 });
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
    const validated = CategorySchema.parse(body);

    const category = await Category.create(validated);
    return NextResponse.json({ success: true, data: category, message: 'ক্যাটাগরি সংরক্ষিত হয়েছে' });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ success: false, message: error.message || 'ক্যাটাগরি যোগ ব্যর্থ হয়েছে' }, { status: 400 });
  }
}
