const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const firstEq = trimmed.indexOf('=');
      if (firstEq > -1) {
        const key = trimmed.substring(0, firstEq).trim();
        let val = trimmed.substring(firstEq + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set in .env.local');
  process.exit(1);
}

// Schemas
const CategorySchema = new mongoose.Schema({
  nameBn: String,
  nameEn: String,
  description: String,
  sortOrder: Number,
  active: { type: Boolean, default: true }
}, { timestamps: true });

const UnitSchema = new mongoose.Schema({
  code: String,
  nameBn: String,
  nameEn: String,
  isBaseUnit: Boolean,
  baseUnit: String,
  conversionFactor: Number,
  active: { type: Boolean, default: true }
}, { timestamps: true });

const SupplierSchema = new mongoose.Schema({
  supplierCode: String,
  name: String,
  company: String,
  phone: String,
  address: String,
  openingBalance: Number,
  currentBalance: Number,
  totalPurchases: Number,
  totalPaid: Number,
  active: { type: Boolean, default: true }
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  productCode: String,
  barcode: String,
  nameBn: String,
  nameEn: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  brand: String,
  manufacturer: String,
  description: String,
  defaultPurchasePrice: Number,
  defaultSalePrice: Number,
  wholesalePrice: Number,
  unit: String,
  packSize: String,
  minimumStock: Number,
  currentStock: Number,
  trackBatch: Boolean,
  trackExpiry: Boolean,
  active: { type: Boolean, default: true },
  notes: String
}, { timestamps: true });

const BatchSchema = new mongoose.Schema({
  batchNumber: String,
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  manufacturingDate: String,
  expiryDate: String,
  purchasePrice: Number,
  salePrice: Number,
  initialQuantity: Number,
  remainingQuantity: Number,
  status: String
}, { timestamps: true });

const StockMovementSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  type: String,
  quantity: Number,
  unit: String,
  baseQuantity: Number,
  previousStock: Number,
  newStock: Number,
  referenceType: String,
  reason: String
}, { timestamps: true });

async function seed() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME || 'agro-db' });
    console.log('Connected to MongoDB Atlas successfully!');

    const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
    const Unit = mongoose.models.Unit || mongoose.model('Unit', UnitSchema);
    const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);
    const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
    const Batch = mongoose.models.Batch || mongoose.model('Batch', BatchSchema);
    const StockMovement = mongoose.models.StockMovement || mongoose.model('StockMovement', StockMovementSchema);

    // 1. Categories
    console.log('Seeding categories...');
    const categoriesList = [
      { nameBn: 'বীজ', nameEn: 'Seeds', sortOrder: 1 },
      { nameBn: 'সার', nameEn: 'Fertilizers', sortOrder: 2 },
      { nameBn: 'কীটনাশক', nameEn: 'Pesticides', sortOrder: 3 },
      { nameBn: 'ছত্রাকনাশক', nameEn: 'Fungicides', sortOrder: 4 },
      { nameBn: 'আগাছানাশক', nameEn: 'Herbicides', sortOrder: 5 },
      { nameBn: 'উদ্ভিদ পুষ্টি', nameEn: 'Plant Nutrients', sortOrder: 6 },
      { nameBn: 'কৃষি যন্ত্রপাতি', nameEn: 'Agri Machinery', sortOrder: 7 },
      { nameBn: 'স্প্রেয়ার', nameEn: 'Sprayers', sortOrder: 8 },
      { nameBn: 'পশু ও পোল্ট্রি ফিড', nameEn: 'Animal & Poultry Feed', sortOrder: 9 },
    ];

    const catMap = {};
    for (const cat of categoriesList) {
      const upserted = await Category.findOneAndUpdate(
        { nameBn: cat.nameBn },
        { $set: cat },
        { upsert: true, new: true }
      );
      catMap[cat.nameBn] = upserted._id;
    }

    // 2. Units
    console.log('Seeding units...');
    const unitsList = [
      { code: 'kg', nameBn: 'কেজি', nameEn: 'Kilogram', isBaseUnit: true, baseUnit: 'kg', conversionFactor: 1 },
      { code: 'gram', nameBn: 'গ্রাম', nameEn: 'Gram', isBaseUnit: false, baseUnit: 'kg', conversionFactor: 0.001 },
      { code: 'sack', nameBn: 'বস্তা', nameEn: 'Sack', isBaseUnit: false, baseUnit: 'kg', conversionFactor: 50 },
      { code: 'liter', nameBn: 'লিটার', nameEn: 'Liter', isBaseUnit: true, baseUnit: 'liter', conversionFactor: 1 },
      { code: 'ml', nameBn: 'মিলি', nameEn: 'Milliliter', isBaseUnit: false, baseUnit: 'liter', conversionFactor: 0.001 },
      { code: 'bottle_100ml', nameBn: '১০০ মিলি বোতল', nameEn: '100ml Bottle', isBaseUnit: false, baseUnit: 'liter', conversionFactor: 0.1 },
      { code: 'bottle_500ml', nameBn: '৫০০ মিলি বোতল', nameEn: '500ml Bottle', isBaseUnit: false, baseUnit: 'liter', conversionFactor: 0.5 },
      { code: 'piece', nameBn: 'পিস', nameEn: 'Piece', isBaseUnit: true, baseUnit: 'piece', conversionFactor: 1 },
      { code: 'packet', nameBn: 'প্যাকেট', nameEn: 'Packet', isBaseUnit: false, baseUnit: 'piece', conversionFactor: 1 },
    ];

    for (const u of unitsList) {
      await Unit.findOneAndUpdate(
        { code: u.code },
        { $set: u },
        { upsert: true }
      );
    }

    // 3. Suppliers
    console.log('Seeding suppliers...');
    const suppliersList = [
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
        name: 'বিএডিসি সার ও বীজ ডিলার',
        company: 'বাংলাদেশ কৃষি উন্নয়ন কর্পোরেশন',
        phone: '01912345678',
        address: 'কৃষি ভবন, দিলকুশা, ঢাকা',
        openingBalance: 0,
        currentBalance: 0,
        totalPurchases: 95000,
        totalPaid: 95000,
        active: true,
      },
      {
        supplierCode: 'SUP-004',
        name: 'সিনজেনটা বাংলাদেশ',
        company: 'সিনজেনটা বাংলাদেশ লিমিটেড',
        phone: '01711998877',
        address: 'গুলশান-১, ঢাকা',
        openingBalance: 30000,
        currentBalance: 30000,
        totalPurchases: 350000,
        totalPaid: 320000,
        active: true,
      }
    ];

    const supMap = {};
    for (const sup of suppliersList) {
      const upserted = await Supplier.findOneAndUpdate(
        { supplierCode: sup.supplierCode },
        { $set: sup },
        { upsert: true, new: true }
      );
      supMap[sup.supplierCode] = upserted._id;
    }

    // 4. Products Catalog
    console.log('Seeding rich agro demo products...');
    const demoProducts = [
      // 1. বীজ (Seeds)
      {
        productCode: 'PRD-SEED-01',
        barcode: '8941100101',
        nameBn: 'উন্নত জাতের ব্রি ধান-২৮ বীজ',
        nameEn: 'BRRI Dhan-28 Certified Paddy Seed',
        category: catMap['বীজ'],
        brand: 'বিএডিসি',
        manufacturer: 'বাংলাদেশ কৃষি উন্নয়ন কর্পোরেশন',
        defaultPurchasePrice: 85,
        defaultSalePrice: 105,
        wholesalePrice: 98,
        unit: 'kg',
        packSize: '১০ কেজি প্যাকেট',
        minimumStock: 25,
        currentStock: 150,
        trackBatch: true,
        trackExpiry: true,
        notes: 'বোরো মৌসুমের জনপ্রিয় উচ্চ ফলনশীল জাত। অঙ্কুরোদগম ক্ষমতা ৯০%+',
      },
      {
        productCode: 'PRD-SEED-02',
        barcode: '8941100102',
        nameBn: 'ভুট্টার হাইব্রিড বীজ এনকে-৪০',
        nameEn: 'Maize Hybrid Seed NK-40',
        category: catMap['বীজ'],
        brand: 'সিনজেনটা',
        manufacturer: 'সিনজেনটা বাংলাদেশ লিমিটেড',
        defaultPurchasePrice: 460,
        defaultSalePrice: 550,
        wholesalePrice: 520,
        unit: 'kg',
        packSize: '১ কেজি প্যাকেট',
        minimumStock: 15,
        currentStock: 60,
        trackBatch: true,
        trackExpiry: true,
        notes: 'উচ্চ ফলনশীল হাইব্রিড ভুট্টা। খরা ও রোগ প্রতিরোধী।',
      },
      {
        productCode: 'PRD-SEED-03',
        barcode: '8941100103',
        nameBn: 'লাল তীর হাইব্রিড মরিচ বীজ বিজলী প্লাস',
        nameEn: 'Lal Teer Hybrid Chili Seed Bijli Plus',
        category: catMap['বীজ'],
        brand: 'লাল তীর',
        manufacturer: 'লাল তীর সীড লিমিটেড',
        defaultPurchasePrice: 280,
        defaultSalePrice: 350,
        wholesalePrice: 330,
        unit: 'packet',
        packSize: '১০ গ্রাম মিনি প্যাক',
        minimumStock: 10,
        currentStock: 45,
        trackBatch: true,
        trackExpiry: true,
        notes: 'গাঢ় সবুজ ও প্রচুর ফলনশীল তীব্র ঝাল হাইব্রিড মরিচ।',
      },

      // 2. সার (Fertilizers)
      {
        productCode: 'PRD-FERT-01',
        barcode: '8941100201',
        nameBn: 'দানাদার ইউরিয়া সার (৫০ কেজি বস্তা)',
        nameEn: 'Granular Urea Fertilizer 50kg',
        category: catMap['সার'],
        brand: 'বিসিআইসি',
        manufacturer: 'বাংলাদেশ কেমিক্যাল ইন্ডাস্ট্রিজ কর্পোরেশন',
        defaultPurchasePrice: 1250,
        defaultSalePrice: 1350,
        wholesalePrice: 1320,
        unit: 'sack',
        packSize: '৫০ কেজি',
        minimumStock: 20,
        currentStock: 110,
        trackBatch: true,
        trackExpiry: false,
        notes: 'নাইট্রোজেন সমৃদ্ধ মৌলিক রাসায়নিক সার। অনুমোদিত ডিলার রেট।',
      },
      {
        productCode: 'PRD-FERT-02',
        barcode: '8941100202',
        nameBn: 'টিএসপি সার (৫০ কেজি বস্তা)',
        nameEn: 'TSP Fertilizer 50kg Bag',
        category: catMap['সার'],
        brand: 'বিসিআইসি',
        manufacturer: 'চিটাগাং টিএসপি কমপ্লেক্স',
        defaultPurchasePrice: 1100,
        defaultSalePrice: 1220,
        wholesalePrice: 1180,
        unit: 'sack',
        packSize: '৫০ কেজি',
        minimumStock: 15,
        currentStock: 8, // Low Stock Trigger
        trackBatch: true,
        trackExpiry: false,
        notes: 'ফসফরাস সরবরাহকারী সার। রুট ডেভেলপমেন্টে কার্যকর।',
      },
      {
        productCode: 'PRD-FERT-03',
        barcode: '8941100203',
        nameBn: 'ডিএপি সার (৫০ কেজি বস্তা)',
        nameEn: 'DAP Fertilizer 50kg Bag',
        category: catMap['সার'],
        brand: 'বিসিআইসি',
        manufacturer: 'আমদানিকৃত সরকারি সার',
        defaultPurchasePrice: 950,
        defaultSalePrice: 1050,
        wholesalePrice: 1020,
        unit: 'sack',
        packSize: '৫০ কেজি',
        minimumStock: 15,
        currentStock: 75,
        trackBatch: true,
        trackExpiry: false,
        notes: 'নাইট্রোজেন ও ফসফরাসের যৌথ মিশ্রণ সার।',
      },
      {
        productCode: 'PRD-FERT-04',
        barcode: '8941100204',
        nameBn: 'এমওপি (পটাশ) সার (৫০ কেজি বস্তা)',
        nameEn: 'MOP Potash Fertilizer 50kg',
        category: catMap['সার'],
        brand: 'বিএডিসি',
        manufacturer: 'আমদানিকৃত বেলোরাশিয়ান পটাশ',
        defaultPurchasePrice: 900,
        defaultSalePrice: 1000,
        wholesalePrice: 970,
        unit: 'sack',
        packSize: '৫০ কেজি',
        minimumStock: 10,
        currentStock: 50,
        trackBatch: true,
        trackExpiry: false,
        notes: 'গাছের রোগ প্রতিরোধ ও ফলের আকার বৃদ্ধিতে পটাশিয়াম সার।',
      },

      // 3. কীটনাশক (Pesticides / Insecticides)
      {
        productCode: 'PRD-PEST-01',
        barcode: '8941100301',
        nameBn: 'ভিরতাকো কীটনাশক (১০০ মিলি)',
        nameEn: 'Virtako Insecticide 100ml',
        category: catMap['কীটনাশক'],
        brand: 'সিনজেনটা',
        manufacturer: 'সিনজেনটা বাংলাদেশ লিমিটেড',
        defaultPurchasePrice: 285,
        defaultSalePrice: 350,
        wholesalePrice: 325,
        unit: 'bottle_100ml',
        packSize: '১০০ মিলি বোতল',
        minimumStock: 15,
        currentStock: 55,
        trackBatch: true,
        trackExpiry: true,
        notes: 'ধানের মাজরা পোকা ও পাতা মোড়ানো পোকা দমনে অত্যন্ত কার্যকর।',
      },
      {
        productCode: 'PRD-PEST-02',
        barcode: '8941100302',
        nameBn: 'মার্শাল ২০ ইসি (৫০০ মিলি)',
        nameEn: 'Marshal 20 EC Insecticide 500ml',
        category: catMap['কীটনাশক'],
        brand: 'এফএমসি',
        manufacturer: 'এফএমসি কেমিক্যাল বিডি লিমিটেড',
        defaultPurchasePrice: 480,
        defaultSalePrice: 580,
        wholesalePrice: 550,
        unit: 'bottle_500ml',
        packSize: '৫০০ মিলি বোতল',
        minimumStock: 10,
        currentStock: 30,
        trackBatch: true,
        trackExpiry: true,
        notes: 'উষ্ণ রক্ত ও শোষক পোকা দমনে কার্বোসালফান গ্রুপের শক্তিশালী কীটনাশক।',
      },
      {
        productCode: 'PRD-PEST-03',
        barcode: '8941100303',
        nameBn: 'নাইট্রো ৫০৫ ইসি (১০০ মিলি)',
        nameEn: 'Nitro 505 EC 100ml',
        category: catMap['কীটনাশক'],
        brand: 'এসিআই',
        manufacturer: 'এসিআই ফরমুলেশনস লিমিটেড',
        defaultPurchasePrice: 195,
        defaultSalePrice: 250,
        wholesalePrice: 230,
        unit: 'bottle_100ml',
        packSize: '১০০ মিলি বোতল',
        minimumStock: 12,
        currentStock: 40,
        trackBatch: true,
        trackExpiry: true,
        notes: 'ক্লোরপাইরিফস ও সাইপারমেথ্রিনের যৌথ মিশ্রণ স্পর্শক ও পাকস্থলী বিষ।',
      },

      // 4. ছত্রাকনাশক (Fungicides)
      {
        productCode: 'PRD-FUNG-01',
        barcode: '8941100401',
        nameBn: 'রিডোমিল গোল্ড এমজেড ৬৮ ডব্লিউজি (১০০ গ্রাম)',
        nameEn: 'Ridomil Gold MZ 68 WG 100g',
        category: catMap['ছত্রাকনাশক'],
        brand: 'সিনজেনটা',
        manufacturer: 'সিনজেনটা বাংলাদেশ লিমিটেড',
        defaultPurchasePrice: 420,
        defaultSalePrice: 520,
        wholesalePrice: 485,
        unit: 'packet',
        packSize: '১০০ গ্রাম প্যাকেট',
        minimumStock: 12,
        currentStock: 45,
        trackBatch: true,
        trackExpiry: true,
        notes: 'আলুর মড়ক (লেট ব্লাইট) ও সবজির ডাউনি মিলডিউ প্রতিরোধে মোক্ষম ওষুধ।',
      },
      {
        productCode: 'PRD-FUNG-02',
        barcode: '8941100402',
        nameBn: 'এমিস্টার টপ ৩২৫ এসসি (১০০ মিলি)',
        nameEn: 'Amistar Top 325 SC 100ml',
        category: catMap['ছত্রাকনাশক'],
        brand: 'সিনজেনটা',
        manufacturer: 'সিনজেনটা বাংলাদেশ লিমিটেড',
        defaultPurchasePrice: 580,
        defaultSalePrice: 700,
        wholesalePrice: 660,
        unit: 'bottle_100ml',
        packSize: '১০০ মিলি বোতল',
        minimumStock: 10,
        currentStock: 25,
        trackBatch: true,
        trackExpiry: true,
        notes: 'ধানের ব্লাস্ট, খোলপোড়া ও সবজির ফল পচা দমনে ব্রড স্পেকট্রাম ছত্রাকনাশক।',
      },
      {
        productCode: 'PRD-FUNG-03',
        barcode: '8941100403',
        nameBn: 'ডাইথেন এম-৪৫ ছত্রাকনাশক (৫০০ গ্রাম)',
        nameEn: 'Dithane M-45 Mancozeb 500g',
        category: catMap['ছত্রাকনাশক'],
        brand: 'ইন্দোফিল',
        manufacturer: 'ইন্দোফিল ইন্ডাস্ট্রিজ',
        defaultPurchasePrice: 310,
        defaultSalePrice: 390,
        wholesalePrice: 360,
        unit: 'packet',
        packSize: '৫০০ গ্রাম প্যাকেট',
        minimumStock: 8,
        currentStock: 20,
        trackBatch: true,
        trackExpiry: true,
        notes: 'ম্যানকোজেব গ্রুপের স্পর্শক ছত্রাকনাশক। প্রতিরোধমূলক ব্যবহারে অত্যন্ত সফল।',
      },

      // 5. আগাছানাশক (Herbicides)
      {
        productCode: 'PRD-HERB-01',
        barcode: '8941100501',
        nameBn: 'সানস্টার প্লাস আগাছানাশক (১০০ গ্রাম)',
        nameEn: 'Sunstar Plus Rice Herbicide 100g',
        category: catMap['আগাছানাশক'],
        brand: 'পদ্মা এগ্রো',
        manufacturer: 'পদ্মা এগ্রো কেমিক্যালস',
        defaultPurchasePrice: 220,
        defaultSalePrice: 280,
        wholesalePrice: 260,
        unit: 'packet',
        packSize: '১০০ গ্রাম প্যাকেট',
        minimumStock: 10,
        currentStock: 35,
        trackBatch: true,
        trackExpiry: true,
        notes: 'ধানের সব ধরণের ঘাস ও চওড়া পাতা আগাছা নিয়ন্ত্রণে।',
      },
      {
        productCode: 'PRD-HERB-02',
        barcode: '8941100502',
        nameBn: 'রাউন্ডআপ আগাছানাশক (১ লিটার)',
        nameEn: 'Roundup Herbicide 1 Liter',
        category: catMap['আগাছানাশক'],
        brand: 'বায়ার',
        manufacturer: 'বায়ার ক্রপসায়েন্স লিমিটেড',
        defaultPurchasePrice: 720,
        defaultSalePrice: 850,
        wholesalePrice: 800,
        unit: 'liter',
        packSize: '১ লিটার বোতল',
        minimumStock: 5,
        currentStock: 15,
        trackBatch: true,
        trackExpiry: true,
        notes: 'অনাবাদি জমি ও চা বাগানের ক্ষতিকর আগাছা সমূলে ধ্বংসকারী গ্লাইফোসেট।',
      },

      // 6. উদ্ভিদ পুষ্টি ও অনুখাদ্য (Plant Nutrients)
      {
        productCode: 'PRD-NUTR-01',
        barcode: '8941100601',
        nameBn: 'ফ্লোরা পিজিআর প্ল্যান্ট টনিক (৫০০ মিলি)',
        nameEn: 'Flora Plant Growth Regulator 500ml',
        category: catMap['উদ্ভিদ পুষ্টি'],
        brand: 'এসিআই',
        manufacturer: 'এসিআই লিমিটেড',
        defaultPurchasePrice: 440,
        defaultSalePrice: 550,
        wholesalePrice: 510,
        unit: 'bottle_500ml',
        packSize: '৫০০ মিলি বোতল',
        minimumStock: 10,
        currentStock: 40,
        trackBatch: true,
        trackExpiry: true,
        notes: 'ফুলের ড্রপিং রোধ করে, ফলের আকার ও সার্বিক ফলন ২০-২৫% বৃদ্ধি করে।',
      },
      {
        productCode: 'PRD-NUTR-02',
        barcode: '8941100602',
        nameBn: 'সলোবর বোরন সার (১০০ গ্রাম)',
        nameEn: 'Solubor Boron 20% 100g',
        category: catMap['উদ্ভিদ পুষ্টি'],
        brand: 'ইউএস বোরাক্স',
        manufacturer: 'আমদানিকৃত দ্রবণীয় বোরন',
        defaultPurchasePrice: 110,
        defaultSalePrice: 150,
        wholesalePrice: 135,
        unit: 'packet',
        packSize: '১০০ গ্রাম প্যাকেট',
        minimumStock: 15,
        currentStock: 65,
        trackBatch: true,
        trackExpiry: true,
        notes: '১০০% পানিতে দ্রবণীয় বোরন। ফল ফাটা রোগ রোধ করে এবং দানাদার ফসলে পুষ্ট বীজ গঠন করে।',
      },
      {
        productCode: 'PRD-NUTR-03',
        barcode: '8941100603',
        nameBn: 'জিংক প্লাস চিলেটেড জিংক (৫০ গ্রাম)',
        nameEn: 'Zinc Plus Chelated Zinc 50g',
        category: catMap['উদ্ভিদ পুষ্টি'],
        brand: 'পদ্মা এগ্রো',
        manufacturer: 'পদ্মা এগ্রো কেমিক্যালস',
        defaultPurchasePrice: 75,
        defaultSalePrice: 105,
        wholesalePrice: 95,
        unit: 'packet',
        packSize: '৫০ গ্রাম প্যাকেট',
        minimumStock: 20,
        currentStock: 90,
        trackBatch: true,
        trackExpiry: true,
        notes: 'ধানের খয়রা রোগ প্রতিরোধে অতি দ্রুত কার্যকর অনুখাদ্য।',
      },

      // 7. কৃষি যন্ত্রপাতি ও স্প্রেয়ার (Machinery & Sprayers)
      {
        productCode: 'PRD-MACH-01',
        barcode: '8941100701',
        nameBn: 'ন্যাপস্যাক রিচার্জেবল ব্যাটারি স্প্রেয়ার (১৬ লিটার)',
        nameEn: 'Knapsack Rechargeable Battery Sprayer 16L',
        category: catMap['স্প্রেয়ার'],
        brand: 'পায়োনিয়ার',
        manufacturer: 'পায়োনিয়ার এগ্রো ইকুইপমেন্ট',
        defaultPurchasePrice: 2250,
        defaultSalePrice: 2850,
        wholesalePrice: 2650,
        unit: 'piece',
        packSize: '১৬ লিটার ট্যাংক কমপ্লিট সেট',
        minimumStock: 3,
        currentStock: 12,
        trackBatch: false,
        trackExpiry: false,
        notes: '১২ ভোল্ট ৮ অ্যাম্পিয়ার হেভি ডিউটি ব্যাটারি ও ৪টি বিভিন্ন নজেলসহ সম্পূর্ণ সেট।',
      },
      {
        productCode: 'PRD-MACH-02',
        barcode: '8941100702',
        nameBn: 'হ্যান্ড প্রেসার গার্ডেন স্প্রেয়ার (২ লিটার)',
        nameEn: 'Hand Pressure Garden Sprayer 2L',
        category: catMap['স্প্রেয়ার'],
        brand: 'এগ্রোটেক',
        manufacturer: 'এগ্রোটেক টুলস',
        defaultPurchasePrice: 180,
        defaultSalePrice: 260,
        wholesalePrice: 230,
        unit: 'piece',
        packSize: '২ লিটার বোতল সেট',
        minimumStock: 5,
        currentStock: 22,
        trackBatch: false,
        trackExpiry: false,
        notes: 'ছাদবাগান ও নার্সারির জন্য আদর্শ মজবুত প্লাস্টিক স্প্রেয়ার।',
      },
      {
        productCode: 'PRD-MACH-03',
        barcode: '8941100703',
        nameBn: 'কৃষি সেচ ফিতা পাইপ (২.৫ ইঞ্চি - ১০০ ফুট)',
        nameEn: 'Agri Irrigation Delivery Hose Pipe 2.5in 100ft',
        category: catMap['কৃষি যন্ত্রপাতি'],
        brand: 'গাজী',
        manufacturer: 'গাজী পলিমারস লিমিটেড',
        defaultPurchasePrice: 1450,
        defaultSalePrice: 1800,
        wholesalePrice: 1680,
        unit: 'piece',
        packSize: '১০০ ফুট কয়েল',
        minimumStock: 2,
        currentStock: 6,
        trackBatch: false,
        trackExpiry: false,
        notes: 'শেলো ইঞ্জিন ও বিদ্যুৎ পাম্পের জন্য ৩ স্তর বিশিষ্ট টেকসই সেচ ফিতা পাইপ।',
      },

      // 8. পশু ও পোল্ট্রি ফিড (Animal/Poultry Feed)
      {
        productCode: 'PRD-FEED-01',
        barcode: '8941100801',
        nameBn: 'নারিশ লেয়ার লেয়ার-১ ফিড (৫০ কেজি বস্তা)',
        nameEn: 'Nourish Layer Poultry Feed 50kg',
        category: catMap['পশু ও পোল্ট্রি ফিড'],
        brand: 'নারিশ',
        manufacturer: 'নারিশ পোল্ট্রি অ্যান্ড হ্যাচারি লিমিটেড',
        defaultPurchasePrice: 2650,
        defaultSalePrice: 2850,
        wholesalePrice: 2780,
        unit: 'sack',
        packSize: '৫০ কেজি বস্তা',
        minimumStock: 10,
        currentStock: 35,
        trackBatch: true,
        trackExpiry: true,
        notes: 'ডিম পাড়া মুরগির জন্য পুষ্টিকর ও সুষম খাদ্য। ক্যালসিয়াম ও প্রোটিন সমৃদ্ধ।',
      },
      {
        productCode: 'PRD-FEED-02',
        barcode: '8941100802',
        nameBn: 'আফতাব ডেইরি ক্যাটল ফিড (২৫ কেজি বস্তা)',
        nameEn: 'Aftab Dairy Cattle Feed 25kg',
        category: catMap['পশু ও পোল্ট্রি ফিড'],
        brand: 'আফতাব',
        manufacturer: 'আফতাব ফিড প্রোডাক্টস লিমিটেড',
        defaultPurchasePrice: 1150,
        defaultSalePrice: 1300,
        wholesalePrice: 1240,
        unit: 'sack',
        packSize: '২৫ কেজি বস্তা',
        minimumStock: 8,
        currentStock: 28,
        trackBatch: true,
        trackExpiry: true,
        notes: 'দুগ্ধবতী গাভীর দুধের উৎপাদন বৃদ্ধি ও স্বাস্থ্য সুরক্ষায় বিশেষ ফর্মুলেশন।',
      },
    ];

    const savedProducts = [];
    for (const p of demoProducts) {
      const upserted = await Product.findOneAndUpdate(
        { productCode: p.productCode },
        { $set: p },
        { upsert: true, new: true }
      );
      savedProducts.push(upserted);
      console.log(`✓ Product saved: ${p.nameBn} (${p.productCode})`);
    }

    // 5. Batches for batch-tracked products
    console.log('Generating dynamic FEFO batches (Good, Expiring Soon, Expired)...');
    
    // Find products for batches
    const virtako = savedProducts.find(p => p.productCode === 'PRD-PEST-01');
    const ridomil = savedProducts.find(p => p.productCode === 'PRD-FUNG-01');
    const dhanSeed = savedProducts.find(p => p.productCode === 'PRD-SEED-01');
    const flora = savedProducts.find(p => p.productCode === 'PRD-NUTR-01');
    const poultryFeed = savedProducts.find(p => p.productCode === 'PRD-FEED-01');

    const padmaSup = supMap['SUP-001'];
    const aciSup = supMap['SUP-002'];
    const badcSup = supMap['SUP-003'];
    const synSup = supMap['SUP-004'] || padmaSup;

    // Helper dates
    const today = new Date();
    
    // In 20 days (Expiring soon)
    const in20Days = new Date(today);
    in20Days.setDate(today.getDate() + 20);
    const in20DaysStr = in20Days.toISOString().split('T')[0];

    // In 45 days (Expiring in 60-day window)
    const in45Days = new Date(today);
    in45Days.setDate(today.getDate() + 45);
    const in45DaysStr = in45Days.toISOString().split('T')[0];

    // In 2 years (Healthy)
    const in2Years = new Date(today);
    in2Years.setFullYear(today.getFullYear() + 2);
    const in2YearsStr = in2Years.toISOString().split('T')[0];

    // Expired 3 months ago
    const past3Months = new Date(today);
    past3Months.setMonth(today.getMonth() - 3);
    const past3MonthsStr = past3Months.toISOString().split('T')[0];

    const demoBatches = [
      // Virtako Healthy Batch (Expiring 2028)
      {
        batchNumber: 'VR-2028-01',
        product: virtako._id,
        supplier: synSup,
        manufacturingDate: '2025-01-10',
        expiryDate: in2YearsStr,
        purchasePrice: 285,
        salePrice: 350,
        initialQuantity: 40,
        remainingQuantity: 35,
        status: 'ACTIVE',
      },
      // Virtako Expiring Soon Batch (20 days remaining)
      {
        batchNumber: 'VR-SOON-20D',
        product: virtako._id,
        supplier: synSup,
        manufacturingDate: '2024-03-15',
        expiryDate: in20DaysStr,
        purchasePrice: 280,
        salePrice: 350,
        initialQuantity: 25,
        remainingQuantity: 20,
        status: 'ACTIVE',
      },
      // Ridomil Gold Healthy Batch
      {
        batchNumber: 'RG-2027-H',
        product: ridomil._id,
        supplier: synSup,
        manufacturingDate: '2025-02-01',
        expiryDate: in2YearsStr,
        purchasePrice: 420,
        salePrice: 520,
        initialQuantity: 50,
        remainingQuantity: 35,
        status: 'ACTIVE',
      },
      // Ridomil Gold Expired Batch
      {
        batchNumber: 'RG-EXP-PAST',
        product: ridomil._id,
        supplier: synSup,
        manufacturingDate: '2023-01-01',
        expiryDate: past3MonthsStr,
        purchasePrice: 410,
        salePrice: 520,
        initialQuantity: 10,
        remainingQuantity: 10,
        status: 'EXPIRED',
      },
      // Rice Seed Batch
      {
        batchNumber: 'BR28-BADC-2026',
        product: dhanSeed._id,
        supplier: badcSup,
        manufacturingDate: '2025-11-01',
        expiryDate: in2YearsStr,
        purchasePrice: 85,
        salePrice: 105,
        initialQuantity: 200,
        remainingQuantity: 150,
        status: 'ACTIVE',
      },
      // Flora Plant Tonic Batch (In 45 days)
      {
        batchNumber: 'FL-45D-WARN',
        product: flora._id,
        supplier: aciSup,
        manufacturingDate: '2024-06-01',
        expiryDate: in45DaysStr,
        purchasePrice: 440,
        salePrice: 550,
        initialQuantity: 30,
        remainingQuantity: 25,
        status: 'ACTIVE',
      },
      // Poultry Feed Batch
      {
        batchNumber: 'NR-FEED-2026A',
        product: poultryFeed._id,
        supplier: aciSup,
        manufacturingDate: '2026-01-01',
        expiryDate: in45DaysStr,
        purchasePrice: 2650,
        salePrice: 2850,
        initialQuantity: 40,
        remainingQuantity: 35,
        status: 'ACTIVE',
      }
    ];

    for (const b of demoBatches) {
      await Batch.findOneAndUpdate(
        { batchNumber: b.batchNumber },
        { $set: b },
        { upsert: true }
      );
      console.log(`✓ Batch created: ${b.batchNumber} (Expiry: ${b.expiryDate}, Status: ${b.status})`);
    }

    // 6. Stock Movements for products
    console.log('Generating initial opening stock movements...');
    for (const prod of savedProducts) {
      await StockMovement.findOneAndUpdate(
        { product: prod._id, type: 'OPENING_STOCK' },
        {
          $set: {
            product: prod._id,
            type: 'OPENING_STOCK',
            quantity: prod.currentStock,
            unit: prod.unit,
            baseQuantity: prod.currentStock,
            previousStock: 0,
            newStock: prod.currentStock,
            reason: 'সিস্টেম ইনিশিয়ালাইজেশন ডেমো পণ্য ওপেনিং স্টক',
          }
        },
        { upsert: true }
      );
    }

    console.log('\n======================================================');
    console.log(`🎉 সর্বমোট ${savedProducts.length} টি ডেমো কৃষি পণ্য এবং ব্যাচ সফলভাবে ডাটাবেজে সংরক্ষণ করা হয়েছে!`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed script error:', error);
    process.exit(1);
  }
}

seed();
