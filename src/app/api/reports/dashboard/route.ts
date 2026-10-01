import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Sale from '@/models/Sale';
import Purchase from '@/models/Purchase';
import Expense from '@/models/Expense';
import Customer from '@/models/Customer';
import Supplier from '@/models/Supplier';
import Product from '@/models/Product';
import Batch from '@/models/Batch';
import { addMoney, subtractMoney, multiplyMoney } from '@/lib/utils/money';

export async function GET() {
  try {
    await connectDB();

    const todayStr = new Date().toISOString().split('T')[0];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Today's Sales
    const todaySales = await Sale.find({ createdAt: { $gte: todayStart } }).lean();
    const todaySalesTotal = todaySales.reduce((sum, s) => addMoney(sum, s.grandTotal || 0), 0);

    // Calculate today's COGS and Profit from actual items
    let todayCogs = 0;
    for (const sale of todaySales) {
      for (const item of sale.items || []) {
        const itemCost = multiplyMoney(item.costPrice || 0, item.quantity || 0);
        todayCogs = addMoney(todayCogs, itemCost);
      }
    }
    const todayGrossProfit = subtractMoney(todaySalesTotal, todayCogs);

    // 2. Today's Purchases
    const todayPurchases = await Purchase.find({ createdAt: { $gte: todayStart } }).lean();
    const todayPurchasesTotal = todayPurchases.reduce((sum, p) => addMoney(sum, p.grandTotal || 0), 0);

    // 3. Today's Expenses
    const todayExpenses = await Expense.find({
      $or: [{ date: todayStr }, { createdAt: { $gte: todayStart } }],
    }).lean();
    const todayExpensesTotal = todayExpenses.reduce((sum, e) => addMoney(sum, e.amount || 0), 0);

    // Today's Net Profit
    const todayNetProfit = subtractMoney(todayGrossProfit, todayExpensesTotal);

    // 4. Total Customer Due
    const customersWithDue = await Customer.find({ active: true, currentBalance: { $gt: 0 } }).lean();
    const totalCustomerDue = customersWithDue.reduce((sum, c) => addMoney(sum, c.currentBalance || 0), 0);

    // 5. Total Supplier Due
    const suppliersWithDue = await Supplier.find({ active: true, currentBalance: { $gt: 0 } }).lean();
    const totalSupplierDue = suppliersWithDue.reduce((sum, s) => addMoney(sum, s.currentBalance || 0), 0);

    // 6. Inventory Valuation & Low Stock
    const products = await Product.find({ active: true }).lean();
    const lowStockProducts = products.filter((p) => (p.currentStock || 0) <= (p.minimumStock || 0));

    let totalStockCostValue = 0;
    for (const p of products) {
      totalStockCostValue = addMoney(
        totalStockCostValue,
        multiplyMoney(p.currentStock || 0, p.defaultPurchasePrice || 0)
      );
    }

    // 7. Expiring Soon (Next 60 days) & Expired Batches
    const sixtyDaysLater = new Date();
    sixtyDaysLater.setDate(sixtyDaysLater.getDate() + 60);
    const sixtyDaysStr = sixtyDaysLater.toISOString().split('T')[0];

    const expiringSoonBatches = await Batch.find({
      remainingQuantity: { $gt: 0 },
      expiryDate: { $lte: sixtyDaysStr, $gte: todayStr },
    })
      .populate('product', 'nameBn')
      .lean();

    const expiredBatches = await Batch.find({
      remainingQuantity: { $gt: 0 },
      expiryDate: { $lt: todayStr },
    })
      .populate('product', 'nameBn')
      .lean();

    // 8. Sales Trend (Past 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const pastWeekSales = await Sale.find({ createdAt: { $gte: sevenDaysAgo } }).lean();
    const salesTrendMap: Record<string, number> = {};

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split('T')[0];
      salesTrendMap[key] = 0;
    }

    pastWeekSales.forEach((s) => {
      const day = new Date(s.createdAt).toISOString().split('T')[0];
      if (salesTrendMap[day] !== undefined) {
        salesTrendMap[day] = addMoney(salesTrendMap[day], s.grandTotal || 0);
      }
    });

    const salesTrend = Object.keys(salesTrendMap).map((date) => ({
      date: date.slice(5), // MM-DD
      sales: salesTrendMap[date],
    }));

    // 9. Recent Sales
    const recentSales = await Sale.find()
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    return NextResponse.json({
      success: true,
      kpis: {
        todaySales: todaySalesTotal,
        todayPurchases: todayPurchasesTotal,
        todayExpenses: todayExpensesTotal,
        todayGrossProfit,
        todayNetProfit,
        totalCustomerDue,
        totalSupplierDue,
        totalStockCostValue,
        lowStockCount: lowStockProducts.length,
        expiringSoonCount: expiringSoonBatches.length,
        expiredCount: expiredBatches.length,
      },
      salesTrend,
      recentSales,
      lowStockProducts: lowStockProducts.slice(0, 5),
      expiringSoonBatches: expiringSoonBatches.slice(0, 5),
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json({ success: false, message: 'ড্যাশবোর্ড তথ্য লোড করা যায়নি' }, { status: 500 });
  }
}
