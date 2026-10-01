import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISaleReturnDocument extends Document {
  returnNumber: string;
  sale: mongoose.Types.ObjectId;
  saleNumber: string;
  customer?: mongoose.Types.ObjectId;
  returnDate: string;
  items: Array<{
    product: mongoose.Types.ObjectId;
    batch?: mongoose.Types.ObjectId;
    productNameBn: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
    returnToStock: boolean;
    condition: 'RESELLABLE' | 'DAMAGED' | 'EXPIRED';
    reason: string;
  }>;
  totalRefundAmount: number;
  refundMethod: string;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SaleReturnSchema = new Schema<ISaleReturnDocument>(
  {
    returnNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    sale: { type: Schema.Types.ObjectId, ref: 'Sale', required: true, index: true },
    saleNumber: { type: String, required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
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
        returnToStock: { type: Boolean, default: true },
        condition: { type: String, enum: ['RESELLABLE', 'DAMAGED', 'EXPIRED'], default: 'RESELLABLE' },
        reason: { type: String, required: true },
      },
    ],
    totalRefundAmount: { type: Number, required: true },
    refundMethod: { type: String, default: 'CASH' },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const SaleReturn: Model<ISaleReturnDocument> =
  mongoose.models.SaleReturn ||
  mongoose.model<ISaleReturnDocument>('SaleReturn', SaleReturnSchema);

export default SaleReturn;
