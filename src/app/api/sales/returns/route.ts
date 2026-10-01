import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Sale from '@/models/Sale';
import SaleReturn from '@/models/SaleReturn';
import Product from '@/models/Product';
import Batch from '@/models/Batch';
import Customer from '@/models/Customer';
import CustomerLedger from '@/models/CustomerLedger';
import StockMovement from '@/models/StockMovement';
import CashShift from '@/models/CashShift';
import { requireAuth } from '@/lib/auth/session';
import { addMoney, subtractMoney, multiplyMoney } from '@/lib/utils/money';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, 'process_returns');
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    const { saleId, items, refundMethod = 'CASH', notes } = body;

    const sale = await Sale.findById(saleId);
    if (!sale) {
      return NextResponse.json({ success: false, message: 'বিক্রয় চালান পাওয়া যায়নি' }, { status: 404 });
    }

    const returnNumber = `SR-${Date.now().toString().slice(-6)}`;
    let totalRefundAmount = 0;
    const processedItems: any[] = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      const itemTotal = multiplyMoney(item.unitPrice, item.quantity);
      totalRefundAmount = addMoney(totalRefundAmount, itemTotal);

      const isResellable = item.condition === 'RESELLABLE' && item.returnToStock !== false;

      const prevStock = product.currentStock || 0;
      let newStock = prevStock;

      if (isResellable) {
        newStock = addMoney(prevStock, item.quantity);
        product.currentStock = newStock;
        await product.save();

        if (item.batch) {
          const batchDoc = await Batch.findById(item.batch);
          if (batchDoc) {
            batchDoc.remainingQuantity = addMoney(batchDoc.remainingQuantity || 0, item.quantity);
            if (batchDoc.status === 'DEPLETED') {
              batchDoc.status = 'ACTIVE';
            }
            await batchDoc.save();
          }
        }
      }

      // Record StockMovement
      await StockMovement.create({
        product: product._id,
        batch: item.batch,
        type: isResellable ? 'SALE_RETURN' : 'DAMAGE',
        quantity: isResellable ? item.quantity : 0,
        unit: item.unit || product.unit,
        baseQuantity: isResellable ? item.quantity : 0,
        referenceType: 'SaleReturn',
        referenceNumber: returnNumber,
        previousStock: prevStock,
        newStock,
        reason: `${item.condition === 'RESELLABLE' ? 'বিক্রয় ফেরত' : 'নষ্ট পণ্য ফেরত'}: ${item.reason || ''}`,
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
        returnToStock: isResellable,
        condition: item.condition || 'RESELLABLE',
        reason: item.reason || 'কাস্টমার ফেরত দিয়েছেন',
      });
    }

    const saleReturn = await SaleReturn.create({
      returnNumber,
      sale: sale._id,
      saleNumber: sale.saleNumber,
      customer: sale.customer,
      returnDate: new Date().toISOString().split('T')[0],
      items: processedItems,
      totalRefundAmount,
      refundMethod,
      notes,
      createdBy: authResult.user._id,
    });

    // Mark original sale
    sale.isReturned = true;
    sale.returnedAmount = addMoney(sale.returnedAmount || 0, totalRefundAmount);
    await sale.save();

    // If customer had due on this sale or has an account, adjust ledger
    if (sale.customer) {
      const customer = await Customer.findById(sale.customer);
      if (customer) {
        const prevBal = customer.currentBalance || 0;
        const newBal = subtractMoney(prevBal, totalRefundAmount);
        customer.currentBalance = newBal;
        await customer.save();

        await CustomerLedger.create({
          customer: customer._id,
          date: new Date().toISOString().split('T')[0],
          type: 'SALE_RETURN',
          referenceType: 'SaleReturn',
          referenceId: saleReturn._id,
          referenceNumber: returnNumber,
          debit: 0,
          credit: totalRefundAmount, // Return reduces customer balance
          balance: newBal,
          notes: `বিক্রয় ফেরত (চালান: ${sale.saleNumber})`,
          createdBy: authResult.user._id,
        });
      }
    }

    // Cash Shift adjustment if Cash refund
    if (refundMethod === 'CASH') {
      const activeShift = await CashShift.findOne({ status: 'OPEN' });
      if (activeShift) {
        activeShift.cashRefunds = addMoney(activeShift.cashRefunds || 0, totalRefundAmount);
        activeShift.expectedCash = subtractMoney(activeShift.expectedCash || 0, totalRefundAmount);
        await activeShift.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'বিক্রয় ফেরত সফলভাবে গ্রহণ ও সমন্বয় করা হয়েছে।',
      data: saleReturn,
    });
  } catch (error: any) {
    console.error('Error in sales return:', error);
    return NextResponse.json({ success: false, message: error.message || 'বিক্রয় ফেরত প্রক্রিয়াকরণে ত্রুটি' }, { status: 400 });
  }
}
