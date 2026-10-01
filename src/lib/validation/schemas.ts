import { z } from 'zod';

export const CategorySchema = z.object({
  nameBn: z.string().min(1, 'বাংলা নাম আবশ্যক'),
  nameEn: z.string().min(1, 'ইংরেজি নাম আবশ্যক'),
  description: z.string().optional(),
  image: z.string().optional(),
  sortOrder: z.number().default(0),
  active: z.boolean().default(true),
});

export const UnitSchema = z.object({
  code: z.string().min(1, 'ইউনিট কোড আবশ্যক'),
  nameBn: z.string().min(1, 'বাংলা নাম আবশ্যক'),
  nameEn: z.string().min(1, 'ইংরেজি নাম আবশ্যক'),
  isBaseUnit: z.boolean().default(false),
  baseUnit: z.string().optional(),
  conversionFactor: z.number().positive('রূপান্তর হার শূন্যের বেশি হতে হবে').default(1),
});

export const ProductSchema = z.object({
  productCode: z.string().min(1, 'পণ্য কোড আবশ্যক'),
  barcode: z.string().optional(),
  nameBn: z.string().min(1, 'বাংলা নাম আবশ্যক'),
  nameEn: z.string().min(1, 'ইংরেজি নাম আবশ্যক'),
  category: z.string().min(1, 'ক্যাটাগরি আবশ্যক'),
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  defaultPurchasePrice: z.number().min(0, 'ক্রয়মূল্য ০ বা তার বেশি হতে হবে'),
  defaultSalePrice: z.number().min(0, 'বিক্রয়মূল্য ০ বা তার বেশি হতে হবে'),
  wholesalePrice: z.number().min(0).optional(),
  unit: z.string().min(1, 'ইউনিট আবশ্যক'),
  packSize: z.string().optional(),
  minimumStock: z.number().min(0).default(5),
  trackBatch: z.boolean().default(true),
  trackExpiry: z.boolean().default(true),
  registrationNumber: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  active: z.boolean().default(true),
  notes: z.string().optional(),
});

export const SupplierSchema = z.object({
  supplierCode: z.string().min(1, 'সাপ্লায়ার কোড আবশ্যক'),
  name: z.string().min(1, 'সাপ্লায়ারের নাম আবশ্যক'),
  company: z.string().min(1, 'কোম্পানির নাম আবশ্যক'),
  phone: z.string().min(11, 'সঠিক ফোন নম্বর প্রদান করুন'),
  alternativePhone: z.string().optional(),
  email: z.string().email('সঠিক ইমেইল দিন').optional().or(z.literal('')),
  address: z.string().optional(),
  openingBalance: z.number().default(0),
  notes: z.string().optional(),
  active: z.boolean().default(true),
});

export const CustomerSchema = z.object({
  customerCode: z.string().min(1, 'কাস্টমার কোড আবশ্যক'),
  name: z.string().min(1, 'কাস্টমারের নাম আবশ্যক'),
  phone: z.string().min(11, 'সঠিক ফোন নম্বর প্রদান করুন'),
  alternativePhone: z.string().optional(),
  village: z.string().optional(),
  union: z.string().optional(),
  upazila: z.string().optional(),
  district: z.string().optional(),
  openingBalance: z.number().default(0),
  creditLimit: z.number().min(0).default(0),
  notes: z.string().optional(),
  active: z.boolean().default(true),
});

export const PurchaseItemSchema = z.object({
  product: z.string().min(1, 'পণ্য নির্বাচন করুন'),
  productNameBn: z.string().min(1),
  batchNumber: z.string().optional(),
  manufacturingDate: z.string().optional(),
  expiryDate: z.string().optional(),
  quantity: z.number().positive('পরিমাণ শূন্যের বেশি হতে হবে'),
  unit: z.string().min(1, 'ইউনিট আবশ্যক'),
  unitConversionFactor: z.number().default(1),
  purchasePrice: z.number().min(0, 'ক্রয়মূল্য ০ বা তার বেশি হতে হবে'),
  salePrice: z.number().min(0).optional(),
});

export const PurchaseSchema = z.object({
  supplier: z.string().min(1, 'সাপ্লায়ার আবশ্যক'),
  invoiceNumber: z.string().optional(),
  purchaseDate: z.string().min(1, 'তারিখ আবশ্যক'),
  items: z.array(PurchaseItemSchema).min(1, 'কমপক্ষে একটি পণ্য যোগ করুন'),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  transportCost: z.number().min(0).default(0),
  otherCost: z.number().min(0).default(0),
  grandTotal: z.number().min(0),
  paidAmount: z.number().min(0).default(0),
  paymentMethod: z.string().default('CASH'),
  notes: z.string().optional(),
  attachment: z.string().optional(),
});

export const SaleItemSchema = z.object({
  product: z.string().min(1, 'পণ্য আইডি আবশ্যক'),
  productNameBn: z.string().min(1),
  productCode: z.string().optional(),
  batch: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  quantity: z.number().positive('পরিমাণ শূন্যের বেশি হতে হবে'),
  unit: z.string().min(1),
  unitPrice: z.number().min(0, 'মূল্য ঋণাত্মক হতে পারে না'),
  costPrice: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  total: z.number().min(0),
});

export const PaymentMethodItemSchema = z.object({
  method: z.enum(['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK', 'CARD', 'OTHER']),
  amount: z.number().min(0),
  reference: z.string().optional(),
});

export const SaleSchema = z.object({
  customer: z.string().optional(),
  customerName: z.string().default('ক্যাশ কাস্টমার'),
  customerPhone: z.string().optional(),
  saleType: z.enum(['RETAIL', 'WHOLESALE']).default('RETAIL'),
  items: z.array(SaleItemSchema).min(1, 'কার্টে পণ্য যোগ করুন'),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  additionalDiscount: z.number().min(0).default(0),
  grandTotal: z.number().min(0),
  paidAmount: z.number().min(0).default(0),
  paymentMethods: z.array(PaymentMethodItemSchema).default([]),
  notes: z.string().optional(),
  overrideReason: z.string().optional(),
});

export const DueCollectionSchema = z.object({
  customer: z.string().min(1, 'কাস্টমার আবশ্যক'),
  amount: z.number().positive('টাকার পরিমাণ শূন্যের বেশি হতে হবে'),
  paymentMethod: z.enum(['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK', 'CARD', 'OTHER']).default('CASH'),
  referenceNumber: z.string().optional(),
  date: z.string().min(1, 'তারিখ আবশ্যক'),
  notes: z.string().optional(),
});

export const SupplierPaymentSchema = z.object({
  supplier: z.string().min(1, 'সাপ্লায়ার আবশ্যক'),
  amount: z.number().positive('টাকার পরিমাণ শূন্যের বেশি হতে হবে'),
  paymentMethod: z.enum(['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK', 'CARD', 'OTHER']).default('CASH'),
  referenceNumber: z.string().optional(),
  date: z.string().min(1, 'তারিখ আবশ্যক'),
  notes: z.string().optional(),
});

export const ExpenseSchema = z.object({
  category: z.string().min(1, 'খরচের ক্যাটাগরি আবশ্যক'),
  amount: z.number().positive('খরচের পরিমাণ শূন্যের বেশি হতে হবে'),
  date: z.string().min(1, 'তারিখ আবশ্যক'),
  description: z.string().min(1, 'বিবরণ আবশ্যক'),
  paymentMethod: z.string().default('CASH'),
  attachment: z.string().optional(),
});

export const StockAdjustmentSchema = z.object({
  product: z.string().min(1, 'পণ্য আবশ্যক'),
  batch: z.string().optional(),
  type: z.enum(['ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'DAMAGE', 'EXPIRED']),
  quantity: z.number().positive('পরিমাণ আবশ্যক'),
  reason: z.string().min(1, 'সমন্বয়ের কারণ উল্লেখ করুন'),
});

export const CashShiftOpenSchema = z.object({
  openingCash: z.number().min(0, 'শুরুর নগদ টাকার পরিমাণ দিন'),
  notes: z.string().optional(),
});

export const CashShiftCloseSchema = z.object({
  actualCash: z.number().min(0, 'সমাপনী নগদ টাকার পরিমাণ দিন'),
  notes: z.string().optional(),
});
