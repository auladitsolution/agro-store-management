import mongoose, { Schema, Model } from 'mongoose';

const SupplierSchema = new Schema(
  {
    supplierCode: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    company: { type: String, required: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true, index: true },
    alternativePhone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0, index: true },
    totalPurchases: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    notes: { type: String },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

SupplierSchema.index({ name: 'text', company: 'text', phone: 'text' });

const Supplier: Model<any> = mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);

export default Supplier;
