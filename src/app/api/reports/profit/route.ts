import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Sale from '@/models/Sale';
import Expense from '@/models/Expense';
import { addMoney, subtractMoney, multiplyMoney } from '@/lib/utils/money';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const saleQuery: any = {};
    const expenseQuery: any = {};

    if (startDate && endDate) {
      saleQuery.createdAt = {
        $gte: new Date(`${startDate}T00:00:00.000Z`),
        $lte: new Date(`${endDate}T23:59:59.999Z`),
      };
      expenseQuery.date = { $gte: startDate, $lte: endDate };
    }

    const sales = await Sale.find(saleQuery).lean();
    const expenses = await Expense.find(expenseQuery).lean();

    let totalRevenue = 0;
    let totalCogs = 0;
    let missingCostCount = 0;

    for (const sale of sales) {
      totalRevenue = addMoney(totalRevenue, sale.grandTotal || 0);

      for (const item of sale.items || []) {
        if (!item.costPrice || item.costPrice === 0) {
          missingCostCount++;
        }
        const itemCost = multiplyMoney(item.costPrice || 0, item.quantity || 0);
        totalCogs = addMoney(totalCogs, itemCost);
      }
    }

    const grossProfit = subtractMoney(totalRevenue, totalCogs);
    const totalExpenses = expenses.reduce((sum, e) => addMoney(sum, e.amount || 0), 0);
    const netProfit = subtractMoney(grossProfit, totalExpenses);

    const hasIncompleteCostData = missingCostCount > 0;

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalCogs,
        grossProfit,
        totalExpenses,
        netProfit,
        salesCount: sales.length,
        hasIncompleteCostData,
        warningMessage: hasIncompleteCostData
          ? 'খরচের তথ্য অসম্পূর্ণ থাকায় লাভের হিসাব আনুমানিক/অসম্পূর্ণ।'
          : null,
      },
    });
  } catch (error) {
    console.error('Error generating profit report:', error);
    return NextResponse.json({ success: false, message: 'লাভের হিসাব তৈরি করা যায়নি' }, { status: 500 });
  }
}
