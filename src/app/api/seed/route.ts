import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/models/User';
import BusinessSettings from '@/models/BusinessSettings';
import Category from '@/models/Category';
import Unit from '@/models/Unit';
import Product from '@/models/Product';
import Batch from '@/models/Batch';
import Supplier from '@/models/Supplier';
import SupplierLedger from '@/models/SupplierLedger';
import Customer from '@/models/Customer';
import CustomerLedger from '@/models/CustomerLedger';
import Purchase from '@/models/Purchase';
import Sale from '@/models/Sale';
import Expense from '@/models/Expense';
import StockMovement from '@/models/StockMovement';
import CashShift from '@/models/CashShift';
import { STANDARD_UNITS } from '@/lib/utils/units';

export async function POST() {
  try {
    await connectDB();

    // 1. Settings
    let settings = await BusinessSettings.findOne();
    if (!settings) {
      settings = await BusinessSettings.create({
        businessNameBn: 'কৃষি বন্ধু এগ্রো স্টোর',
        businessNameEn: 'Krishi Bondhu Agro Store',
        ownerName: 'মোঃ আওলাদ হোসেন',
        phone: '01711223344',
        email: 'info@agrostore.com',
        address: 'স্টেশন রোড, রংপুর সদর, রংপুর',
        tradeLicense: 'TR-RNG-2024-8891',
        vatNumber: 'BIN-002341992-0102',
        receiptFooterBn: 'আমাদের সাথে থাকার জন্য আন্তরিক ধন্যবাদ! সুস্থ ফসলে সমৃদ্ধ দেশ।',
      });
    }

    // 2. Default Owner
    let owner = await User.findOne({ role: 'OWNER' });
    if (!owner) {
      owner = await User.create({
        firebaseUid: 'owner_demo_uid_001',
        name: 'মোঃ আওলাদ হোসেন',
        email: 'owner@agrostore.com',
        phone: '01711223344',
        role: 'OWNER',
        active: true,
        permissions: [],
      });
    }

    // 3. Units
    await Unit.deleteMany({});
    const unitsToInsert = STANDARD_UNITS.map((u) => ({
      code: u.code,
      nameBn: u.nameBn,
      nameEn: u.nameEn,
      isBaseUnit: u.category === 'weight' ? u.code === 'kg' : u.category === 'volume' ? u.code === 'liter' : u.code === 'piece',
      baseUnit: u.baseUnit,
      conversionFactor: u.defaultConversionFactor,
    }));
    await Unit.insertMany(unitsToInsert);

    // 4. Categories
    await Category.deleteMany({});
    const categories = await Category.insertMany([
      { nameBn: 'বীজ', nameEn: 'Seeds', sortOrder: 1 },
      { nameBn: 'সার', nameEn: 'Fertilizers', sortOrder: 2 },
      { nameBn: 'কীটনাশক', nameEn: 'Pesticides', sortOrder: 3 },
      { nameBn: 'ছত্রাকনাশক', nameEn: 'Fungicides', sortOrder: 4 },
      { nameBn: 'আগাছানাশক', nameEn: 'Herbicides', sortOrder: 5 },
      { nameBn: 'উদ্ভিদ পুষ্টি', nameEn: 'Plant Nutrients', sortOrder: 6 },
      { nameBn: 'কৃষি যন্ত্রপাতি', nameEn: 'Agri Machinery', sortOrder: 7 },
      { nameBn: 'স্প্রেয়ার', nameEn: 'Sprayers', sortOrder: 8 },
    ]);

    const catMap: Record<string, any> = {};
    categories.forEach((c) => {
      catMap[c.nameBn] = c._id;
    });

    // 5. Suppliers
    await Supplier.deleteMany({});
    await SupplierLedger.deleteMany({});
    const suppliers = await Supplier.insertMany([
      {
        supplierCode: 'SUP-001',
        name: 'পদ্মা এগ্রো কেমিক্যালস',
        company: 'পদ্মা এগ্রো লিমিটেড',
        phone: '01712345678',
        address: 'তেজগাঁও শিল্প এলাকা, ঢাকা',
        openingBalance: 25000,
        currentBalance: 25000,
        totalPurchases: 180000,
        totalPaid: 155000,
        active: true,
      },
      {
        supplierCode: 'SUP-002',
        name: 'এসিআই এগ্রোভেট',
        company: 'এসিআই লিমিটেড',
        phone: '01812345678',
        address: 'মতিঝিল বা/এ, ঢাকা',
        openingBalance: 15000,
        currentBalance: 15000,
        totalPurchases: 220000,
        totalPaid: 205000,
        active: true,
      },
      {
        supplierCode: 'SUP-003',
        name: 'বিএডিসি বীজ ডিলার',
        company: 'বাংলাদেশ কৃষি উন্নয়ন কর্পোরেশন',
        phone: '01912345678',
        address: 'কৃষি ভবন, দিলকুশা, ঢাকা',
        openingBalance: 0,
        currentBalance: 0,
        totalPurchases: 95000,
        totalPaid: 95000,
        active: true,
      },
    ]);

    // Supplier initial ledgers
    for (const sup of suppliers) {
      if (sup.openingBalance > 0) {
        await SupplierLedger.create({
          supplier: sup._id,
          date: '01/01/2026',
          type: 'OPENING_BALANCE',
          referenceType: 'Manual',
          debit: 0,
          credit: sup.openingBalance,
          balance: sup.openingBalance,
          notes: 'প্রারম্ভিক বকেয়া ব্যালেন্স',
          createdBy: owner._id,
        });
      }
    }

    // 6. Customers
    await Customer.deleteMany({});
    await CustomerLedger.deleteMany({});
    const customers = await Customer.insertMany([
      {
        customerCode: 'CUST-001',
        name: 'মোঃ ফজলুল হক',
        phone: '01711002233',
        village: 'হাড়ীভাঙ্গা',
        union: 'পদ্মপুকুর',
        upazila: 'রংপুর সদর',
        district: 'রংপুর',
        openingBalance: 4500,
        currentBalance: 4500,
        creditLimit: 20000,
        totalPurchases: 45000,
        totalPaid: 40500,
        active: true,
      },
      {
        customerCode: 'CUST-002',
        name: 'করিম শেখ',
        phone: '01811002233',
        village: 'চকবাজার',
        union: 'মির্জাপুর',
        upazila: 'মিঠাপুকুর',
        district: 'রংপুর',
        openingBalance: 12000,
        currentBalance: 12000,
        creditLimit: 30000,
        totalPurchases: 85000,
        totalPaid: 73000,
        active: true,
      },
      {
        customerCode: 'CUST-003',
        name: 'রহমত আলী (নগদ ক্রেতা)',
        phone: '01911002233',
        village: 'গংগাচড়া',
        district: 'রংপুর',
        openingBalance: 0,
        currentBalance: 0,
        creditLimit: 10000,
        totalPurchases: 25000,
        totalPaid: 25000,
        active: true,
      },
    ]);

    for (const cust of customers) {
      if (cust.openingBalance > 0) {
        await CustomerLedger.create({
          customer: cust._id,
          date: '01/01/2026',
          type: 'OPENING_BALANCE',
          referenceType: 'Manual',
          debit: cust.openingBalance,
          credit: 0,
          balance: cust.openingBalance,
          notes: 'প্রারম্ভিক বকেয়া ব্যালেন্স',
          createdBy: owner._id,
        });
      }
    }

    // 7. Products
    await Product.deleteMany({});
    await Batch.deleteMany({});
    await StockMovement.deleteMany({});

    const productsData = [
      {
        productCode: 'PRD-SEED-01',
        barcode: '8941100101',
        nameBn: 'ব্রি ধান-২৮ উন্নত বীজ',
        nameEn: 'BRRI Dhan-28 Certified Seed',
        category: catMap['বীজ'],
        brand: 'বিএডিসি',
        defaultPurchasePrice: 85,
        defaultSalePrice: 105,
        wholesalePrice: 98,
        unit: 'kg',
        packSize: '১০ কেজি প্যাকেট',
        minimumStock: 20,
        currentStock: 120,
        trackBatch: true,
        trackExpiry: true,
      },
      {
        productCode: 'PRD-SEED-02',
        barcode: '8941100102',
        nameBn: 'ভুট্টার বীজ এনকে-৪০',
        nameEn: 'Maize Seed NK-40',
        category: catMap['বীজ'],
        brand: 'সিনজেনটা',
        defaultPurchasePrice: 450,
        defaultSalePrice: 540,
        wholesalePrice: 510,
        unit: 'kg',
        packSize: '১ কেজি প্যাকেট',
        minimumStock: 10,
        currentStock: 45,
        trackBatch: true,
        trackExpiry: true,
      },
      {
        productCode: 'PRD-FERT-01',
        barcode: '8941100201',
        nameBn: 'ইউরিয়া সার (৫০ কেজি বস্তা)',
        nameEn: 'Urea Fertilizer (50kg Bag)',
        category: catMap['সার'],
        brand: 'বিসিআইসি',
        defaultPurchasePrice: 1250,
        defaultSalePrice: 1350,
        wholesalePrice: 1320,
        unit: 'sack',
        packSize: '৫০ কেজি',
        minimumStock: 15,
        currentStock: 80,
        trackBatch: true,
        trackExpiry: false,
      },
      {
        productCode: 'PRD-FERT-02',
        barcode: '8941100202',
        nameBn: 'টিএসপি সার',
        nameEn: 'TSP Fertilizer',
        category: catMap['সার'],
        brand: 'বিসিআইসি',
        defaultPurchasePrice: 1100,
        defaultSalePrice: 1200,
        wholesalePrice: 1170,
        unit: 'sack',
        packSize: '৫০ কেজি',
        minimumStock: 10,
        currentStock: 4, // LOW STOCK TRIGGER
        trackBatch: true,
        trackExpiry: false,
      },
      {
        productCode: 'PRD-PEST-01',
        barcode: '8941100301',
        nameBn: 'ভিরতাকো কীটনাশক (১০০ মিলি)',
        nameEn: 'Virtako Insecticide 100ml',
        category: catMap['কীটনাশক'],
        brand: 'সিনজেনটা',
        defaultPurchasePrice: 280,
        defaultSalePrice: 340,
        wholesalePrice: 320,
        unit: 'bottle_100ml',
        packSize: '১০০ মিলি বোতল',
        minimumStock: 15,
        currentStock: 35,
        trackBatch: true,
        trackExpiry: true,
      },
      {
        productCode: 'PRD-FUNG-01',
        barcode: '8941100401',
        nameBn: 'রিডোমিল গোল্ড ছত্রাকনাশক',
        nameEn: 'Ridomil Gold Fungicide',
        category: catMap['ছত্রাকনাশক'],
        brand: 'সিনজেনটা',
        defaultPurchasePrice: 420,
        defaultSalePrice: 510,
        wholesalePrice: 480,
        unit: 'packet',
        packSize: '১০০ গ্রাম',
        minimumStock: 10,
        currentStock: 25,
        trackBatch: true,
        trackExpiry: true,
      },
      {
        productCode: 'PRD-MACH-01',
        barcode: '8941100501',
        nameBn: 'ন্যাপস্যাক ব্যাটারি স্প্রেয়ার (১৬ লিটার)',
        nameEn: 'Knapsack Battery Sprayer 16L',
        category: catMap['স্প্রেয়ার'],
        brand: 'পায়োনিয়ার',
        defaultPurchasePrice: 2200,
        defaultSalePrice: 2800,
        wholesalePrice: 2600,
        unit: 'piece',
        packSize: '১৬ লিটার ট্যাংক',
        minimumStock: 3,
        currentStock: 8,
        trackBatch: false,
        trackExpiry: false,
      },
    ];

    const insertedProducts = await Product.insertMany(productsData);

    // 8. Batches
    // Batch 1: Good batch for Virtako (expiring in 2028)
    await Batch.create({
      batchNumber: 'VR-2028-A',
      product: insertedProducts[4]._id,
      supplier: suppliers[0]._id,
      manufacturingDate: '2025-01-10',
      expiryDate: '2028-01-10',
      purchasePrice: 280,
      salePrice: 340,
      initialQuantity: 50,
      remainingQuantity: 25,
      status: 'ACTIVE',
    });

    // Batch 2: Expiring Soon batch for Virtako (within 30 days)
    const nextTwentyDays = new Date();
    nextTwentyDays.setDate(nextTwentyDays.getDate() + 20);
    await Batch.create({
      batchNumber: 'VR-SOON-20',
      product: insertedProducts[4]._id,
      supplier: suppliers[0]._id,
      manufacturingDate: '2024-05-10',
      expiryDate: nextTwentyDays.toISOString().split('T')[0],
      purchasePrice: 280,
      salePrice: 340,
      initialQuantity: 20,
      remainingQuantity: 10,
      status: 'ACTIVE',
    });

    // Batch 3: Expired batch for Ridomil Gold
    await Batch.create({
      batchNumber: 'RG-EXPIRED-99',
      product: insertedProducts[5]._id,
      supplier: suppliers[1]._id,
      manufacturingDate: '2023-01-10',
      expiryDate: '2025-01-10',
      purchasePrice: 420,
      salePrice: 510,
      initialQuantity: 10,
      remainingQuantity: 5,
      status: 'EXPIRED',
    });

    // Initial Stock Movements
    for (const prod of insertedProducts) {
      await StockMovement.create({
        product: prod._id,
        type: 'OPENING_STOCK',
        quantity: prod.currentStock,
        unit: prod.unit,
        baseQuantity: prod.currentStock,
        previousStock: 0,
        newStock: prod.currentStock,
        reason: 'সিস্টেম ইনিশিয়ালাইজেশন ওপেনিং স্টক',
        createdBy: owner._id,
      });
    }

    // 9. Sample Expenses
    await Expense.deleteMany({});
    await Expense.insertMany([
      {
        category: 'দোকান ভাড়া',
        amount: 8000,
        date: new Date().toISOString().split('T')[0],
        description: 'চলতি মাসের দোকান ভাড়া পরিশোধ',
        paymentMethod: 'CASH',
        createdBy: owner._id,
      },
      {
        category: 'বিদ্যুৎ',
        amount: 1450,
        date: new Date().toISOString().split('T')[0],
        description: 'পল্লী বিদ্যুৎ বিল',
        paymentMethod: 'BKASH',
        createdBy: owner._id,
      },
      {
        category: 'পরিবহন',
        amount: 1200,
        date: new Date().toISOString().split('T')[0],
        description: 'গোডাউন থেকে দোকানে সার বহন খরচ',
        paymentMethod: 'CASH',
        createdBy: owner._id,
      },
    ]);

    // 10. Open a default active cash shift
    await CashShift.deleteMany({});
    await CashShift.create({
      shiftDate: new Date().toISOString().split('T')[0],
      openedAt: new Date().toISOString(),
      openedBy: owner.name,
      openingCash: 5000,
      cashSales: 12400,
      cashDueCollections: 3000,
      cashSupplierPayments: 2000,
      cashExpenses: 1200,
      cashIn: 0,
      cashOut: 0,
      cashRefunds: 0,
      expectedCash: 17200,
      status: 'OPEN',
      notes: 'সকালের নিয়মিত ক্যাশ শিফট ওপেন',
    });

    return NextResponse.json({
      success: true,
      message: 'কৃষি বন্ধু এগ্রো স্টোর-এর ডেমো ডাটা সফলভাবে সেটআপ হয়েছে!',
    });
  } catch (error: any) {
    console.error('Error seeding demo data:', error);
    return NextResponse.json({ success: false, message: error.message || 'সিড ডাটা সেটআপে ত্রুটি' }, { status: 500 });
  }
}
