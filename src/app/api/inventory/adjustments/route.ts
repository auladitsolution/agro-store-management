import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Product from '@/models/Product';
import Batch from '@/models/Batch';
import StockMovement from '@/models/StockMovement';
import AuditLog from '@/models/AuditLog';
import { requireAuth } from '@/lib/auth/session';
import { StockAdjustmentSchema } from '@/lib/validation/schemas';
import { addMoney, subtractMoney } from '@/lib/utils/money';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, 'manage_inventory');
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    const validated = StockAdjustmentSchema.parse(body);

    const product = await Product.findById(validated.product);
    if (!product) {
      return NextResponse.json({ success: false, message: 'পণ্য পাওয়া যায়নি' }, { status: 404 });
    }

    const prevStock = product.currentStock || 0;
    const isIncrement = validated.type === 'ADJUSTMENT_IN';
    const adjustmentQty = validated.quantity;

    if (!isIncrement && prevStock < adjustmentQty) {
      return NextResponse.json(
        { success: false, message: `স্টকে পর্যাপ্ত পরিমাণ নেই। বর্তমান স্টক: ${prevStock}` },
        { status: 400 }
      );
    }

    const newStock = isIncrement
      ? addMoney(prevStock, adjustmentQty)
      : Math.max(0, subtractMoney(prevStock, adjustmentQty));

    product.currentStock = newStock;
    await product.save();

    // Adjust batch if specified
    if (validated.batch) {
      const batchDoc = await Batch.findById(validated.batch);
      if (batchDoc) {
        const prevBatchQty = batchDoc.remainingQuantity || 0;
        batchDoc.remainingQuantity = isIncrement
          ? addMoney(prevBatchQty, adjustmentQty)
          : Math.max(0, subtractMoney(prevBatchQty, adjustmentQty));
        if (batchDoc.remainingQuantity <= 0) {
          batchDoc.status = 'DEPLETED';
        }
        await batchDoc.save();
      }
    }

    // Record Stock Movement
    await StockMovement.create({
      product: product._id,
      batch: validated.batch,
      type: validated.type,
      quantity: isIncrement ? adjustmentQty : -adjustmentQty,
      unit: product.unit,
      baseQuantity: isIncrement ? adjustmentQty : -adjustmentQty,
      referenceType: 'Adjustment',
      previousStock: prevStock,
      newStock,
      reason: validated.reason,
      createdBy: authResult.user._id,
    });

    // Record Audit Log
    await AuditLog.create({
      user: authResult.user._id,
      userName: authResult.user.name,
      action: 'STOCK_ADJUSTMENT',
      entityType: 'Product',
      entityId: product._id,
      beforeSummary: `স্টক: ${prevStock} ${product.unit}`,
      afterSummary: `সমন্বয়কৃত স্টক: ${newStock} ${product.unit} (${validated.type})`,
      reason: validated.reason,
      metadata: { quantity: adjustmentQty, type: validated.type, batch: validated.batch },
    });

    return NextResponse.json({
      success: true,
      message: 'স্টক সফলভাবে সমন্বয় করা হয়েছে।',
      currentStock: newStock,
    });
  } catch (error: any) {
    console.error('Error in stock adjustment:', error);
    return NextResponse.json({ success: false, message: error.message || 'স্টক সমন্বয়ে ত্রুটি' }, { status: 400 });
  }
}
