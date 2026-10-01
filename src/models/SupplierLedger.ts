import mongoose, { Schema, Model } from 'mongoose';

const SupplierLedgerSchema = new Schema(
  {
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    date: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['OPENING_BALANCE', 'PURCHASE', 'PAYMENT', 'PURCHASE_RETURN', 'ADJUSTMENT'],
      required: true,
      index: true,
    },
    referenceType: { type: String, enum: ['Purchase', 'Payment', 'PurchaseReturn', 'Manual'] },
    referenceId: { type: Schema.Types.ObjectId },
    referenceNumber: { type: String, trim: true },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    balance: { type: Number, required: true },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

SupplierLedgerSchema.index({ supplier: 1, date: -1, createdAt: -1 });

const SupplierLedger: Model<any> =
  mongoose.models.SupplierLedger || mongoose.model('SupplierLedger', SupplierLedgerSchema);

export default SupplierLedger;
