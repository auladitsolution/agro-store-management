import mongoose, { Schema, Model } from 'mongoose';

const CustomerLedgerSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    date: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['OPENING_BALANCE', 'SALE', 'PAYMENT', 'SALE_RETURN', 'ADJUSTMENT'],
      required: true,
      index: true,
    },
    referenceType: { type: String, enum: ['Sale', 'Payment', 'SaleReturn', 'Manual'] },
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

CustomerLedgerSchema.index({ customer: 1, date: -1, createdAt: -1 });

const CustomerLedger: Model<any> =
  mongoose.models.CustomerLedger || mongoose.model('CustomerLedger', CustomerLedgerSchema);

export default CustomerLedger;
