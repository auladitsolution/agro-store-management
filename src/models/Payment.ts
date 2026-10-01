import mongoose, { Schema, Model } from 'mongoose';

const PaymentSchema = new Schema(
  {
    paymentNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    type: {
      type: String,
      enum: ['CUSTOMER_PAYMENT', 'SUPPLIER_PAYMENT'],
      required: true,
      index: true,
    },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', index: true },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK', 'CARD', 'OTHER'],
      default: 'CASH',
      required: true,
    },
    referenceNumber: { type: String, trim: true },
    date: { type: String, required: true, index: true },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

PaymentSchema.index({ type: 1, date: -1 });

const Payment: Model<any> = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);

export default Payment;
