import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Purchase from '@/models/Purchase';
import PurchaseReturn from '@/models/PurchaseReturn';
import Product from '@/models/Product';
import Batch from '@/models/Batch';
import Supplier from '@/models/Supplier';
import SupplierLedger from '@/models/SupplierLedger';
import StockMovement from '@/models/StockMovement';
import { requireAuth } from '@/lib/auth/session';
import { subtractMoney, addMoney, multiplyMoney } from '@/lib/utils/money';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, 'manage_purchases');
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    const { purchaseId, items, returnDate, notes } = body;

    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return NextResponse.json({ success: false, message: 'মূল ক্রয় চালানটি পাওয়া যায়নি' }, { status: 404 });
    }

    const supplier = await Supplier.findById(purchase.supplier);
    if (!supplier) {
      return NextResponse.json({ success: false, message: 'সাপ্লায়ার পাওয়া যায়নি' }, { status: 404 });
    }

    const returnNumber = `PR-${Date.now().toString().slice(-6)}`;
    let totalRefundAmount = 0;
    const processedItems: any[] = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      const itemTotal = multiplyMoney(item.unitPrice, item.quantity);
      totalRefundAmount = addMoney(totalRefundAmount, itemTotal);

      // Decrement product currentStock
      const prevStock = product.currentStock || 0;
      const newStock = Math.max(0, subtractMoney(prevStock, item.quantity));
      product.currentStock = newStock;
      await product.save();

      // Decrement batch if provided
      if (item.batch) {
        const batchDoc = await Batch.findById(item.batch);
        if (batchDoc) {
          batchDoc.remainingQuantity = Math.max(0, subtractMoney(batchDoc.remainingQuantity || 0, item.quantity));
          if (batchDoc.remainingQuantity <= 0) {
            batchDoc.status = 'DEPLETED';
          }
          await batchDoc.save();
        }
      }

      // Record StockMovement
      await StockMovement.create({
        product: product._id,
        batch: item.batch,
        type: 'PURCHASE_RETURN',
        quantity: -item.quantity,
        unit: item.unit || product.unit,
        baseQuantity: -item.quantity,
        referenceType: 'PurchaseReturn',
        referenceNumber: returnNumber,
        previousStock: prevStock,
        newStock,
        reason: item.reason || `সাপ্লায়ারে ফেরত ${returnNumber}`,
        createdBy: authResult.user._id,
      });

      processedItems.push({
        product: product._id,
        batch: item.batch,
        productNameBn: product.nameBn,
        quantity: item.quantity,
        unit: item.unit || product.unit,
        unitPrice: item.unitPrice,
        total: itemTotal,
        reason: item.reason || 'সাপ্লায়ারে ফেরত',
      });
    }

    const purchaseReturn = await PurchaseReturn.create({
      returnNumber,
      purchase: purchase._id,
      supplier: supplier._id,
      returnDate: returnDate || new Date().toISOString().split('T')[0],
      items: processedItems,
      totalRefundAmount,
      notes,
      createdBy: authResult.user._id,
    });

    // Update supplier balance and ledger
    const prevSupplierBalance = supplier.currentBalance || 0;
    const newSupplierBalance = subtractMoney(prevSupplierBalance, totalRefundAmount);
    supplier.currentBalance = newSupplierBalance;
    await supplier.save();

    await SupplierLedger.create({
      supplier: supplier._id,
      date: returnDate || new Date().toISOString().split('T')[0],
      type: 'PURCHASE_RETURN',
      referenceType: 'PurchaseReturn',
      referenceId: purchaseReturn._id,
      referenceNumber: returnNumber,
      debit: totalRefundAmount, // Return reduces what we owe
      credit: 0,
      balance: newSupplierBalance,
      notes: `পণ্য ফেরত (চালান: ${purchase.purchaseNumber})`,
      createdBy: authResult.user._id,
    });

    return NextResponse.json({
      success: true,
      message: 'পণ্য সফলভাবে সাপ্লায়ারে ফেরত দেওয়া হয়েছে।',
      data: purchaseReturn,
    });
  } catch (error: any) {
    console.error('Error processing purchase return:', error);
    return NextResponse.json({ success: false, message: error.message || 'ফেরত প্রক্রিয়াকরণে ত্রুটি' }, { status: 400 });
  }
}
