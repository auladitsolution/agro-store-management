import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Purchase from '@/models/Purchase';
import Product from '@/models/Product';
import Batch from '@/models/Batch';
import Supplier from '@/models/Supplier';
import SupplierLedger from '@/models/SupplierLedger';
import StockMovement from '@/models/StockMovement';
import Payment from '@/models/Payment';
import CashShift from '@/models/CashShift';
import BusinessSettings from '@/models/BusinessSettings';
import { requireAuth } from '@/lib/auth/session';
import { PurchaseSchema } from '@/lib/validation/schemas';
import { addMoney, subtractMoney, multiplyMoney, roundMoney } from '@/lib/utils/money';
import { toBaseQuantity } from '@/lib/utils/units';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get('supplier');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const query: any = {};
    if (supplierId) query.supplier = supplierId;

    const purchases = await Purchase.find(query)
      .populate('supplier', 'name company phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, data: purchases });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ success: false, message: 'ক্রয় তালিকা লোড করা যায়নি' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, 'manage_purchases');
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    const validated = PurchaseSchema.parse(body);

    const supplier = await Supplier.findById(validated.supplier);
    if (!supplier) {
      return NextResponse.json({ success: false, message: 'সাপ্লায়ার পাওয়া যায়নি' }, { status: 404 });
    }

    const settings = await BusinessSettings.findOne().lean();
    const prefix = settings?.salesSettings?.purchasePrefix || 'PUR-';
    const purchaseNumber = `${prefix}${Date.now().toString().slice(-6)}`;

    // Calculate totals securely
    let calculatedSubtotal = 0;
    const processedItems: any[] = [];

    for (const item of validated.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(`পণ্য আইডি ${item.product} খুঁজে পাওয়া যায়নি।`);
      }

      const itemTotal = multiplyMoney(item.purchasePrice, item.quantity);
      calculatedSubtotal = addMoney(calculatedSubtotal, itemTotal);

      const baseQuantity = toBaseQuantity(item.quantity, item.unitConversionFactor || 1);

      // Create or update Batch
      let batchDoc: any = null;
      const batchNo = item.batchNumber?.trim().toUpperCase() || `BAT-${Date.now().toString().slice(-4)}`;

      batchDoc = await Batch.create({
        batchNumber: batchNo,
        product: product._id,
        supplier: supplier._id,
        manufacturingDate: item.manufacturingDate,
        expiryDate: item.expiryDate,
        purchasePrice: item.purchasePrice,
        salePrice: item.salePrice || product.defaultSalePrice,
        initialQuantity: baseQuantity,
        remainingQuantity: baseQuantity,
        status: 'ACTIVE',
      });

      // Update product stock and default prices
      const previousStock = product.currentStock || 0;
      const newStock = addMoney(previousStock, baseQuantity);
      product.currentStock = newStock;
      product.defaultPurchasePrice = item.purchasePrice;
      if (item.salePrice && item.salePrice > 0) {
        product.defaultSalePrice = item.salePrice;
      }
      await product.save();

      // Record StockMovement
      await StockMovement.create({
        product: product._id,
        batch: batchDoc._id,
        type: 'PURCHASE',
        quantity: item.quantity,
        unit: item.unit,
        baseQuantity: baseQuantity,
        referenceType: 'Purchase',
        referenceNumber: purchaseNumber,
        previousStock,
        newStock,
        reason: `ক্রয় চালান ${purchaseNumber}`,
        createdBy: authResult.user._id,
      });

      processedItems.push({
        product: product._id,
        productNameBn: product.nameBn,
        batchNumber: batchNo,
        manufacturingDate: item.manufacturingDate,
        expiryDate: item.expiryDate,
        quantity: item.quantity,
        unit: item.unit,
        unitConversionFactor: item.unitConversionFactor || 1,
        baseQuantity,
        purchasePrice: item.purchasePrice,
        salePrice: item.salePrice || product.defaultSalePrice,
        total: itemTotal,
        batchId: batchDoc._id,
      });
    }

    const grandTotal = addMoney(
      subtractMoney(calculatedSubtotal, validated.discount),
      validated.transportCost,
      validated.otherCost
    );

    const paidAmount = roundMoney(validated.paidAmount || 0);
    const dueAmount = subtractMoney(grandTotal, paidAmount);
    const paymentStatus = dueAmount <= 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'DUE';

    const purchase = await Purchase.create({
      purchaseNumber,
      supplier: supplier._id,
      invoiceNumber: validated.invoiceNumber,
      purchaseDate: validated.purchaseDate,
      items: processedItems,
      subtotal: calculatedSubtotal,
      discount: validated.discount,
      transportCost: validated.transportCost,
      otherCost: validated.otherCost,
      grandTotal,
      paidAmount,
      dueAmount,
      paymentStatus,
      paymentMethod: validated.paymentMethod,
      notes: validated.notes,
      attachment: validated.attachment,
      createdBy: authResult.user._id,
    });

    // Update Supplier Balance & Ledger
    const previousSupplierBalance = supplier.currentBalance || 0;
    const newSupplierBalance = addMoney(previousSupplierBalance, dueAmount);
    supplier.currentBalance = newSupplierBalance;
    supplier.totalPurchases = addMoney(supplier.totalPurchases || 0, grandTotal);
    supplier.totalPaid = addMoney(supplier.totalPaid || 0, paidAmount);
    await supplier.save();

    await SupplierLedger.create({
      supplier: supplier._id,
      date: validated.purchaseDate,
      type: 'PURCHASE',
      referenceType: 'Purchase',
      referenceId: purchase._id,
      referenceNumber: purchaseNumber,
      debit: paidAmount, // Paid immediately
      credit: grandTotal, // Invoiced total
      balance: newSupplierBalance,
      notes: `ক্রয় চালান ${purchaseNumber}${validated.invoiceNumber ? ` (ইনভয়েস: ${validated.invoiceNumber})` : ''}`,
      createdBy: authResult.user._id,
    });

    // Record Payment if paidAmount > 0
    if (paidAmount > 0) {
      await Payment.create({
        paymentNumber: `PAY-${Date.now().toString().slice(-6)}`,
        type: 'SUPPLIER_PAYMENT',
        supplier: supplier._id,
        amount: paidAmount,
        paymentMethod: validated.paymentMethod,
        date: validated.purchaseDate,
        notes: `ক্রয় চালান ${purchaseNumber}-এর তাৎক্ষণিক পরিশোধ`,
        createdBy: authResult.user._id,
      });

      if (validated.paymentMethod === 'CASH') {
        const activeShift = await CashShift.findOne({ status: 'OPEN' });
        if (activeShift) {
          activeShift.cashSupplierPayments = addMoney(activeShift.cashSupplierPayments || 0, paidAmount);
          activeShift.expectedCash = subtractMoney(activeShift.expectedCash || 0, paidAmount);
          await activeShift.save();
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'ক্রয় সফলভাবে সম্পন্ন ও স্টক হালনাগাদ হয়েছে।',
      data: purchase,
    });
  } catch (error: any) {
    console.error('Error in purchase creation:', error);
    return NextResponse.json({ success: false, message: error.message || 'ক্রয় প্রক্রিয়াকরণে ত্রুটি' }, { status: 400 });
  }
}
