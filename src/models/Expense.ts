import mongoose, { Schema, Model } from 'mongoose';

const ExpenseSchema = new Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: String, required: true, index: true },
    description: { type: String, required: true, trim: true },
    paymentMethod: { type: String, default: 'CASH' },
    attachment: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ExpenseSchema.index({ date: -1, category: 1 });

const Expense: Model<any> = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);

export default Expense;
