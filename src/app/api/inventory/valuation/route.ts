import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Product from '@/models/Product';
import Batch from '@/models/Batch';
import { addMoney, multiplyMoney } from '@/lib/utils/money';

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find({ active: true }).populate('category', 'nameBn').lean();
    const batches = await Batch.find({ remainingQuantity: { $gt: 0 } }).lean();

    let totalCostValuation = 0;
    let totalRetailValuation = 0;

    const valuationItems = products.map((prod: any) => {
      const prodBatches = batches.filter((b) => b.product.toString() === prod._id.toString());
      let productCostValue = 0;

      if (prodBatches.length > 0) {
        productCostValue = prodBatches.reduce(
          (sum, b) => addMoney(sum, multiplyMoney(b.remainingQuantity, b.purchasePrice)),
          0
        );
      } else {
        productCostValue = multiplyMoney(prod.currentStock || 0, prod.defaultPurchasePrice || 0);
      }

      const productRetailValue = multiplyMoney(prod.currentStock || 0, prod.defaultSalePrice || 0);

      totalCostValuation = addMoney(totalCostValuation, productCostValue);
      totalRetailValuation = addMoney(totalRetailValuation, productRetailValue);

      return {
        _id: prod._id,
        productCode: prod.productCode,
        nameBn: prod.nameBn,
        nameEn: prod.nameEn,
        category: prod.category?.nameBn || '-',
        currentStock: prod.currentStock || 0,
        unit: prod.unit,
        defaultPurchasePrice: prod.defaultPurchasePrice,
        defaultSalePrice: prod.defaultSalePrice,
        costValue: productCostValue,
        retailValue: productRetailValue,
      };
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalCostValuation,
        totalRetailValuation,
        potentialProfit: addMoney(totalRetailValuation, -totalCostValuation),
      },
      data: valuationItems,
    });
  } catch (error) {
    console.error('Error fetching inventory valuation:', error);
    return NextResponse.json({ success: false, message: 'স্টক মূল্যায়ন লোড করা যায়নি' }, { status: 500 });
  }
}
