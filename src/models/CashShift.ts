import mongoose, { Schema, Model } from 'mongoose';

const CashShiftSchema = new Schema(
  {
    shiftDate: { type: String, required: true, index: true },
    openedAt: { type: String, required: true },
    closedAt: { type: String },
    openedBy: { type: String, required: true },
    closedBy: { type: String },
    openingCash: { type: Number, required: true, default: 0 },
    cashSales: { type: Number, default: 0 },
    cashDueCollections: { type: Number, default: 0 },
    cashSupplierPayments: { type: Number, default: 0 },
    cashExpenses: { type: Number, default: 0 },
    cashIn: { type: Number, default: 0 },
    cashOut: { type: Number, default: 0 },
    cashRefunds: { type: Number, default: 0 },
    expectedCash: { type: Number, default: 0 },
    actualCash: { type: Number },
    difference: { type: Number },
    status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN', index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

const CashShift: Model<any> = mongoose.models.CashShift || mongoose.model('CashShift', CashShiftSchema);

export default CashShift;
