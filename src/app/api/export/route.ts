import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import Supplier from '@/models/Supplier';
import Sale from '@/models/Sale';
import Purchase from '@/models/Purchase';
import Expense from '@/models/Expense';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'products';

    let csvContent = '';
    let filename = `${type}_export.csv`;

    if (type === 'products') {
      const items = await Product.find({ active: true }).populate('category', 'nameBn').lean();
      csvContent = 'Product Code,Name (Bangla),Name (English),Category,Stock,Unit,Purchase Price,Sale Price\n';
      items.forEach((p: any) => {
        csvContent += `"${p.productCode}","${p.nameBn}","${p.nameEn}","${p.category?.nameBn || ''}",${p.currentStock},"${p.unit}",${p.defaultPurchasePrice},${p.defaultSalePrice}\n`;
      });
    } else if (type === 'customers') {
      const items = await Customer.find({ active: true }).lean();
      csvContent = 'Customer Code,Name,Phone,Address,Current Due,Credit Limit\n';
      items.forEach((c: any) => {
        csvContent += `"${c.customerCode}","${c.name}","${c.phone}","${c.village || ''}",${c.currentBalance},${c.creditLimit}\n`;
      });
    } else if (type === 'suppliers') {
      const items = await Supplier.find({ active: true }).lean();
      csvContent = 'Supplier Code,Name,Company,Phone,Current Due\n';
      items.forEach((s: any) => {
        csvContent += `"${s.supplierCode}","${s.name}","${s.company}","${s.phone}",${s.currentBalance}\n`;
      });
    } else if (type === 'sales') {
      const items = await Sale.find().populate('customer', 'name phone').sort({ createdAt: -1 }).limit(500).lean();
      csvContent = 'Invoice Number,Date,Customer,Total,Paid,Due,Payment Status\n';
      items.forEach((s: any) => {
        csvContent += `"${s.saleNumber}","${new Date(s.createdAt).toISOString().split('T')[0]}","${s.customerName || 'ক্যাশ কাস্টমার'}",${s.grandTotal},${s.paidAmount},${s.dueAmount},"${s.paymentStatus}"\n`;
      });
    } else if (type === 'purchases') {
      const items = await Purchase.find().populate('supplier', 'name company').sort({ createdAt: -1 }).limit(500).lean();
      csvContent = 'Purchase Number,Date,Supplier,Total,Paid,Due,Status\n';
      items.forEach((p: any) => {
        csvContent += `"${p.purchaseNumber}","${p.purchaseDate}","${(p.supplier as any)?.company || ''}",${p.grandTotal},${p.paidAmount},${p.dueAmount},"${p.paymentStatus}"\n`;
      });
    } else if (type === 'expenses') {
      const items = await Expense.find().sort({ date: -1 }).limit(500).lean();
      csvContent = 'Category,Date,Amount,Description,Payment Method\n';
      items.forEach((e: any) => {
        csvContent += `"${e.category}","${e.date}",${e.amount},"${e.description}","${e.paymentMethod}"\n`;
      });
    }

    // Add UTF-8 BOM so Excel opens Bangla characters properly
    const bom = '\uFEFF';
    return new NextResponse(bom + csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ success: false, message: 'এক্সপোর্ট ব্যর্থ হয়েছে' }, { status: 500 });
  }
}
