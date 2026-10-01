import mongoose, { Schema, Model } from 'mongoose';

const SaleItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productNameBn: { type: String, required: true },
    productCode: { type: String },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch' },
    batchNumber: { type: String },
    expiryDate: { type: String },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    costPrice: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const PaymentMethodSchema = new Schema(
  {
    method: {
      type: String,
      enum: ['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK', 'CARD', 'OTHER'],
      required: true,
    },
    amount: { type: Number, required: true },
    reference: { type: String },
  },
  { _id: false }
);

const SaleSchema = new Schema(
  {
    saleNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
    customerName: { type: String, default: 'ক্যাশ কাস্টমার' },
    customerPhone: { type: String, index: true },
    saleType: { type: String, enum: ['RETAIL', 'WHOLESALE'], default: 'RETAIL', index: true },
    items: [SaleItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    additionalDiscount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, required: true, default: 0 },
    dueAmount: { type: Number, required: true, default: 0 },
    changeAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PARTIAL', 'DUE', 'REFUNDED'],
      required: true,
      default: 'PAID',
      index: true,
    },
    paymentMethods: [PaymentMethodSchema],
    salesperson: { type: Schema.Types.ObjectId, ref: 'User' },
    salespersonName: { type: String },
    notes: { type: String },
    overrideReason: { type: String },
    isReturned: { type: Boolean, default: false },
    returnedAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SaleSchema.index({ createdAt: -1 });

const Sale: Model<any> = mongoose.models.Sale || mongoose.model('Sale', SaleSchema);

export default Sale;
