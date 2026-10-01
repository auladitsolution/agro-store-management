import mongoose, { Schema, Model } from 'mongoose';

const UserSchema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    photo: { type: String },
    role: {
      type: String,
      enum: ['OWNER', 'MANAGER', 'CASHIER', 'INVENTORY_MANAGER'],
      default: 'CASHIER',
      required: true,
      index: true,
    },
    permissions: [{ type: String }],
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const User: Model<any> = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
