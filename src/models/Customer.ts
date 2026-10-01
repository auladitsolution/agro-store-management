import mongoose, { Schema, Model } from 'mongoose';

const CustomerSchema = new Schema(
  {
    customerCode: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true, index: true },
    alternativePhone: { type: String, trim: true },
    village: { type: String, trim: true },
    union: { type: String, trim: true },
    upazila: { type: String, trim: true },
    district: { type: String, trim: true },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0, index: true },
    creditLimit: { type: Number, default: 0 },
    totalPurchases: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    notes: { type: String },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

CustomerSchema.index({ name: 'text', phone: 'text', customerCode: 'text' });

const Customer: Model<any> = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);

export default Customer;
