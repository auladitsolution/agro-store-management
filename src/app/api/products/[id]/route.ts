import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Product from '@/models/Product';
import Batch from '@/models/Batch';
import { requireAuth } from '@/lib/auth/session';
import { ProductSchema } from '@/lib/validation/schemas';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const product = await Product.findById(id).populate('category').lean();
    if (!product) {
      return NextResponse.json({ success: false, message: 'পণ্যটি পাওয়া যায়নি' }, { status: 404 });
    }

    const batches = await Batch.find({ product: id, remainingQuantity: { $gt: 0 } }).lean();

    return NextResponse.json({ success: true, data: { ...product, batches } });
  } catch (error) {
    console.error('Error fetching product by id:', error);
    return NextResponse.json({ success: false, message: 'পণ্য লোড করা যায়নি' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(req, 'manage_products');
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const validated = ProductSchema.parse(body);

    const updated = await Product.findByIdAndUpdate(
      id,
      { ...validated, productCode: validated.productCode.toUpperCase() },
      { new: true }
    );

    return NextResponse.json({ success: true, data: updated, message: 'পণ্য সফলভাবে হালনাগাদ করা হয়েছে।' });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, message: error.message || 'হালনাগাদ ব্যর্থ হয়েছে' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(req, 'manage_products');
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const { id } = await params;
    // Soft delete product
    await Product.findByIdAndUpdate(id, { active: false });

    return NextResponse.json({ success: true, message: 'পণ্য সফলভাবে নিষ্ক্রিয় করা হয়েছে।' });
  } catch (error) {
    console.error('Error deactivating product:', error);
    return NextResponse.json({ success: false, message: 'নিষ্ক্রিয় করা যায়নি' }, { status: 500 });
  }
}
