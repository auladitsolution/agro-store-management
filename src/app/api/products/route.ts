import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Product from '@/models/Product';
import StockMovement from '@/models/StockMovement';
import { requireAuth } from '@/lib/auth/session';
import { ProductSchema } from '@/lib/validation/schemas';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const lowStock = searchParams.get('lowStock') === 'true';
    const outOfStock = searchParams.get('outOfStock') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const query: any = { active: true };

    if (search) {
      query.$or = [
        { nameBn: { $regex: search, $options: 'i' } },
        { nameEn: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (lowStock) {
      query.$expr = { $lte: ['$currentStock', '$minimumStock'] };
    }

    if (outOfStock) {
      query.currentStock = { $lte: 0 };
    }

    const products = await Product.find(query)
      .populate('category', 'nameBn nameEn')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ success: false, message: 'পণ্য লোড করা যায়নি' }, { status: 500 });
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
    const validated = ProductSchema.parse(body);

    // Check duplicate code
    const existingCode = await Product.findOne({ productCode: validated.productCode.toUpperCase() });
    if (existingCode) {
      return NextResponse.json(
        { success: false, message: 'এই পণ্য কোডটি ইতিমধ্যে ব্যবহৃত হচ্ছে।' },
        { status: 400 }
      );
    }

    const product = await Product.create({
      ...validated,
      productCode: validated.productCode.toUpperCase(),
      currentStock: body.openingStock ? Number(body.openingStock) : 0,
    });

    // If opening stock provided, record StockMovement
    if (body.openingStock && Number(body.openingStock) > 0) {
      await StockMovement.create({
        product: product._id,
        type: 'OPENING_STOCK',
        quantity: Number(body.openingStock),
        unit: product.unit,
        baseQuantity: Number(body.openingStock),
        reason: 'প্রারম্ভিক স্টক এন্ট্রি',
        previousStock: 0,
        newStock: Number(body.openingStock),
        createdBy: authResult.user._id,
      });
    }

    return NextResponse.json({ success: true, data: product, message: 'পণ্য সফলভাবে তৈরি হয়েছে।' });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ success: false, message: error.message || 'পণ্য তৈরিতে সমস্যা হয়েছে' }, { status: 400 });
  }
}
