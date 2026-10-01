import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPurchaseReturnDocument extends Document {
  returnNumber: string;
  purchase: mongoose.Types.ObjectId;
  supplier: mongoose.Types.ObjectId;
  returnDate: string;
  items: Array<{
    product: mongoose.Types.ObjectId;
    batch?: mongoose.Types.ObjectId;
    productNameBn: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
    reason: string;
  }>;
  totalRefundAmount: number;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseReturnSchema = new Schema<IPurchaseReturnDocument>(
  {
    returnNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    purchase: { type: Schema.Types.ObjectId, ref: 'Purchase', required: true, index: true },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    returnDate: { type: String, required: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        batch: { type: Schema.Types.ObjectId, ref: 'Batch' },
        productNameBn: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true },
        unitPrice: { type: Number, required: true },
        total: { type: Number, required: true },
        reason: { type: String, required: true },
      },
    ],
    totalRefundAmount: { type: Number, required: true },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const PurchaseReturn: Model<IPurchaseReturnDocument> =
  mongoose.models.PurchaseReturn ||
  mongoose.model<IPurchaseReturnDocument>('PurchaseReturn', PurchaseReturnSchema);

export default PurchaseReturn;
