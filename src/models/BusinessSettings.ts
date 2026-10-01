import mongoose, { Schema, Model } from 'mongoose';

const BusinessSettingsSchema = new Schema(
  {
    businessNameBn: { type: String, required: true, default: 'কৃষি বন্ধু এগ্রো স্টোর' },
    businessNameEn: { type: String, required: true, default: 'Krishi Bondhu Agro Store' },
    ownerName: { type: String, required: true, default: 'মোঃ আওলাদ হোসেন' },
    logo: { type: String },
    phone: { type: String, required: true, default: '01700000000' },
    email: { type: String, default: 'info@agrostore.com' },
    address: { type: String, required: true, default: 'বাজার রোড, রংপুর, বাংলাদেশ' },
    tradeLicense: { type: String },
    vatNumber: { type: String },
    receiptFooterBn: { type: String, default: 'আমাদের সাথে থাকার জন্য ধন্যবাদ! সুস্থ ফসলে সমৃদ্ধ দেশ।' },
    receiptFooterEn: { type: String, default: 'Thank you for your business!' },
    currency: { type: String, default: 'BDT' },
    currencySymbol: { type: String, default: '৳' },
    timezone: { type: String, default: 'Asia/Dhaka' },
    features: {
      batchTracking: { type: Boolean, default: true },
      expiryManagement: { type: Boolean, default: true },
      barcode: { type: Boolean, default: true },
      wholesale: { type: Boolean, default: true },
      customerLedger: { type: Boolean, default: true },
      supplierLedger: { type: Boolean, default: true },
      cashRegister: { type: Boolean, default: true },
      advancedReports: { type: Boolean, default: true },
      purchaseReturns: { type: Boolean, default: true },
      salesReturns: { type: Boolean, default: true },
      creditLimitCheck: { type: Boolean, default: true },
    },
    inventorySettings: {
      expiryWarningDays: { type: Number, default: 60 },
      lowStockThresholdDefault: { type: Number, default: 10 },
      fefoAutoSelect: { type: Boolean, default: true },
      allowExpiredSaleOverride: { type: Boolean, default: false },
    },
    salesSettings: {
      invoicePrefix: { type: String, default: 'INV-' },
      purchasePrefix: { type: String, default: 'PUR-' },
      allowPriceOverride: { type: Boolean, default: false },
      allowDiscounts: { type: Boolean, default: true },
      requireCustomerForDue: { type: Boolean, default: true },
      printFormatDefault: { type: String, enum: ['thermal58', 'thermal80', 'a4'], default: 'thermal80' },
    },
  },
  { timestamps: true }
);

const BusinessSettings: Model<any> =
  mongoose.models.BusinessSettings || mongoose.model('BusinessSettings', BusinessSettingsSchema);

export default BusinessSettings;
