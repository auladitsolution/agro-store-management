import mongoose, { Schema, Model } from 'mongoose';

const BatchSchema = new Schema(
  {
    batchNumber: { type: String, required: true, trim: true, uppercase: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', index: true },
    purchase: { type: Schema.Types.ObjectId, ref: 'Purchase' },
    manufacturingDate: { type: String },
    expiryDate: { type: String, index: true },
    purchasePrice: { type: Number, required: true, default: 0 },
    salePrice: { type: Number, required: true, default: 0 },
    initialQuantity: { type: Number, required: true, default: 0 },
    remainingQuantity: { type: Number, required: true, default: 0, index: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'DEPLETED', 'EXPIRED', 'RECALLED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  { timestamps: true }
);

BatchSchema.index({ product: 1, expiryDate: 1, remainingQuantity: 1 });

const Batch: Model<any> = mongoose.models.Batch || mongoose.model('Batch', BatchSchema);

export default Batch;
