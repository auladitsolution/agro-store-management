import mongoose, { Schema, Model } from 'mongoose';

const StockMovementSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch', index: true },
    type: {
      type: String,
      enum: [
        'PURCHASE',
        'SALE',
        'SALE_RETURN',
        'PURCHASE_RETURN',
        'ADJUSTMENT_IN',
        'ADJUSTMENT_OUT',
        'DAMAGE',
        'EXPIRED',
        'OPENING_STOCK',
      ],
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    baseQuantity: { type: Number, required: true },
    referenceType: { type: String, enum: ['Purchase', 'Sale', 'SaleReturn', 'PurchaseReturn', 'Adjustment'] },
    referenceId: { type: Schema.Types.ObjectId },
    referenceNumber: { type: String, trim: true },
    reason: { type: String },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

StockMovementSchema.index({ product: 1, createdAt: -1 });

const StockMovement: Model<any> =
  mongoose.models.StockMovement || mongoose.model('StockMovement', StockMovementSchema);

export default StockMovement;
