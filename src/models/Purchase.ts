import mongoose, { Schema, Model } from 'mongoose';

const PurchaseItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productNameBn: { type: String, required: true },
    batchNumber: { type: String },
    manufacturingDate: { type: String },
    expiryDate: { type: String },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    unitConversionFactor: { type: Number, default: 1 },
    baseQuantity: { type: Number, required: true },
    purchasePrice: { type: Number, required: true },
    salePrice: { type: Number },
    total: { type: Number, required: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch' },
  },
  { _id: false }
);

const PurchaseSchema = new Schema(
  {
    purchaseNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    invoiceNumber: { type: String, trim: true },
    purchaseDate: { type: String, required: true, index: true },
    items: [PurchaseItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    transportCost: { type: Number, default: 0 },
    otherCost: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, required: true, default: 0 },
    dueAmount: { type: Number, required: true, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PARTIAL', 'DUE'],
      required: true,
      default: 'PAID',
      index: true,
    },
    paymentMethod: { type: String, default: 'CASH' },
    notes: { type: String },
    attachment: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Purchase: Model<any> = mongoose.models.Purchase || mongoose.model('Purchase', PurchaseSchema);

export default Purchase;
