import mongoose, { Schema, Model } from 'mongoose';

const NotificationSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['LOW_STOCK', 'EXPIRING_SOON', 'EXPIRED', 'CREDIT_LIMIT', 'SUPPLIER_DUE', 'INFO'],
      required: true,
      index: true,
    },
    entityType: { type: String, enum: ['Product', 'Batch', 'Customer', 'Supplier', 'System'] },
    entityId: { type: Schema.Types.ObjectId },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

const Notification: Model<any> =
  mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

export default Notification;
