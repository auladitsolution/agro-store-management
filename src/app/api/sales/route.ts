import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import Batch from '@/models/Batch';
import Customer from '@/models/Customer';
import CustomerLedger from '@/models/CustomerLedger';
import StockMovement from '@/models/StockMovement';
import CashShift from '@/models/CashShift';
import BusinessSettings from '@/models/BusinessSettings';
import { requireAuth } from '@/lib/auth/session';
import { SaleSchema } from '@/lib/validation/schemas';
import { addMoney, subtractMoney, multiplyMoney, roundMoney } from '@/lib/utils/money';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customer');
    const paymentStatus = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const query: any = {};
    if (customerId) query.customer = customerId;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const sales = await Sale.find(query)
      .populate('customer', 'name phone customerCode')
      .populate('salesperson', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, data: sales });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ success: false, message: 'বিক্রয় তালিকা লোড করা যায়নি' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, 'process_sales');
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    const validated = SaleSchema.parse(body);

    const settings = await BusinessSettings.findOne().lean();
    const prefix = settings?.salesSettings?.invoicePrefix || 'INV-';
    const saleNumber = `${prefix}${Date.now().toString().slice(-6)}`;

    // 1. Validate Stock & Expiry for each item
    let calculatedSubtotal = 0;
    const processedItems: any[] = [];

    for (const item of validated.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return NextResponse.json({ success: false, message: `পণ্য পাওয়া যায়নি` }, { status: 404 });
      }

      if ((product.currentStock || 0) < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            message: `"${product.nameBn}" পণ্যের পর্যাপ্ত স্টক নেই। বর্তমান স্টক: ${product.currentStock} ${product.unit}`,
          },
          { status: 400 }
        );
      }

      let costPrice = product.defaultPurchasePrice || 0;
      let batchDoc: any = null;

      if (item.batch) {
        batchDoc = await Batch.findById(item.batch);
        if (batchDoc) {
          // Check expiry
          if (batchDoc.expiryDate) {
            const isExpired = new Date(batchDoc.expiryDate).getTime() < new Date().getTime();
            if (isExpired && !validated.overrideReason) {
              return NextResponse.json(
                {
                  success: false,
                  message: `"${product.nameBn}" পণ্যের ${batchDoc.batchNumber} ব্যাচটির মেয়াদ শেষ হয়েছে। বিক্রয় সম্ভব নয়।`,
                },
                { status: 400 }
              );
            }
          }

          if ((batchDoc.remainingQuantity || 0) < item.quantity) {
            return NextResponse.json(
              {
                success: false,
                message: `ব্যাচ ${batchDoc.batchNumber}-এ পর্যাপ্ত স্টক নেই (${batchDoc.remainingQuantity} বিদ্যমান)।`,
              },
              { status: 400 }
            );
          }

          costPrice = batchDoc.purchasePrice || costPrice;
        }
      }

      const itemTotal = subtractMoney(multiplyMoney(item.unitPrice, item.quantity), item.discount || 0);
      calculatedSubtotal = addMoney(calculatedSubtotal, itemTotal);

      // Decrement stock
      const prevStock = product.currentStock || 0;
      const newStock = Math.max(0, subtractMoney(prevStock, item.quantity));
      product.currentStock = newStock;
      await product.save();

      // Decrement batch if linked
      if (batchDoc) {
        const prevBatchQty = batchDoc.remainingQuantity || 0;
        const newBatchQty = Math.max(0, subtractMoney(prevBatchQty, item.quantity));
        batchDoc.remainingQuantity = newBatchQty;
        if (newBatchQty <= 0) {
          batchDoc.status = 'DEPLETED';
        }
        await batchDoc.save();
      }

      // Record StockMovement
      await StockMovement.create({
        product: product._id,
        batch: batchDoc ? batchDoc._id : undefined,
        type: 'SALE',
        quantity: -item.quantity,
        unit: item.unit || product.unit,
        baseQuantity: -item.quantity,
        referenceType: 'Sale',
        referenceNumber: saleNumber,
        previousStock: prevStock,
        newStock,
        reason: `বিক্রয় চালান ${saleNumber}`,
        createdBy: authResult.user._id,
      });

      processedItems.push({
        product: product._id,
        productNameBn: product.nameBn,
        productCode: product.productCode,
        batch: batchDoc ? batchDoc._id : undefined,
        batchNumber: batchDoc ? batchDoc.batchNumber : undefined,
        expiryDate: batchDoc ? batchDoc.expiryDate : undefined,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        costPrice,
        discount: item.discount || 0,
        total: itemTotal,
      });
    }

    const grandTotal = Math.max(0, subtractMoney(calculatedSubtotal, validated.additionalDiscount || 0));
    const paidAmount = roundMoney(validated.paidAmount || 0);

    let dueAmount = 0;
    let changeAmount = 0;

    if (paidAmount >= grandTotal) {
      dueAmount = 0;
      changeAmount = subtractMoney(paidAmount, grandTotal);
    } else {
      dueAmount = subtractMoney(grandTotal, paidAmount);
      changeAmount = 0;
    }

    // Customer validation for Due sale
    let customerDoc: any = null;
    if (validated.customer) {
      customerDoc = await Customer.findById(validated.customer);
    }

    if (dueAmount > 0 && !customerDoc && settings?.salesSettings?.requireCustomerForDue) {
      return NextResponse.json(
        { success: false, message: 'বাকি বিক্রয়ের ক্ষেত্রে কাস্টমার নির্বাচন করা আবশ্যক।' },
        { status: 400 }
      );
    }

    // Check credit limit
    if (customerDoc && dueAmount > 0 && customerDoc.creditLimit > 0) {
      const prospectiveDue = addMoney(customerDoc.currentBalance || 0, dueAmount);
      if (prospectiveDue > customerDoc.creditLimit && !validated.overrideReason) {
        return NextResponse.json(
          {
            success: false,
            message: `কাস্টমারের নির্ধারিত বাকি সীমা (৳ ${customerDoc.creditLimit}) অতিক্রম করবে। বর্তমান বাকি: ৳ ${customerDoc.currentBalance}। অতিরিক্ত বাকি অনুমোদন প্রয়োজন।`,
          },
          { status: 400 }
        );
      }
    }

    const paymentStatus = dueAmount === 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'DUE';

    const sale = await Sale.create({
      saleNumber,
      customer: customerDoc ? customerDoc._id : undefined,
      customerName: customerDoc ? customerDoc.name : validated.customerName || 'ক্যাশ কাস্টমার',
      customerPhone: customerDoc ? customerDoc.phone : validated.customerPhone,
      saleType: validated.saleType || 'RETAIL',
      items: processedItems,
      subtotal: calculatedSubtotal,
      discount: validated.discount || 0,
      additionalDiscount: validated.additionalDiscount || 0,
      grandTotal,
      paidAmount,
      dueAmount,
      changeAmount,
      paymentStatus,
      paymentMethods: validated.paymentMethods.length > 0
        ? validated.paymentMethods
        : [{ method: 'CASH', amount: paidAmount }],
      salesperson: authResult.user._id,
      salespersonName: authResult.user.name,
      notes: validated.notes,
      overrideReason: validated.overrideReason,
    });

    // Update Customer Balance & Ledger if Customer exists
    if (customerDoc) {
      const prevCustomerBalance = customerDoc.currentBalance || 0;
      const newCustomerBalance = addMoney(prevCustomerBalance, dueAmount);
      customerDoc.currentBalance = newCustomerBalance;
      customerDoc.totalPurchases = addMoney(customerDoc.totalPurchases || 0, grandTotal);
      customerDoc.totalPaid = addMoney(customerDoc.totalPaid || 0, paidAmount);
      await customerDoc.save();

      await CustomerLedger.create({
        customer: customerDoc._id,
        date: new Date().toISOString().split('T')[0],
        type: 'SALE',
        referenceType: 'Sale',
        referenceId: sale._id,
        referenceNumber: saleNumber,
        debit: grandTotal, // Invoiced total
        credit: paidAmount, // Paid right away
        balance: newCustomerBalance,
        notes: `বিক্রয় চালান ${saleNumber}`,
        createdBy: authResult.user._id,
      });
    }

    // Update Active Cash Shift for cash paid component
    const cashMethod = validated.paymentMethods.find((p) => p.method === 'CASH');
    const cashPaid = cashMethod ? cashMethod.amount : paidAmount;

    if (cashPaid > 0) {
      const activeShift = await CashShift.findOne({ status: 'OPEN' });
      if (activeShift) {
        activeShift.cashSales = addMoney(activeShift.cashSales || 0, cashPaid);
        activeShift.expectedCash = addMoney(activeShift.expectedCash || 0, cashPaid);
        await activeShift.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'বিক্রয় সফলভাবে সম্পন্ন হয়েছে।',
      data: sale,
    });
  } catch (error: any) {
    console.error('Error in POS checkout / sale completion:', error);
    return NextResponse.json({ success: false, message: error.message || 'বিক্রয় প্রক্রিয়াকরণে সমস্যা হয়েছে' }, { status: 400 });
  }
}
