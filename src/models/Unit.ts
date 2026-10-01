import mongoose, { Schema, Model } from 'mongoose';

const UnitSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    nameBn: { type: String, required: true, trim: true },
    nameEn: { type: String, required: true, trim: true },
    isBaseUnit: { type: Boolean, default: false },
    baseUnit: { type: String, trim: true },
    conversionFactor: { type: Number, default: 1 },
  },
  { timestamps: true }
);

const Unit: Model<any> = mongoose.models.Unit || mongoose.model('Unit', UnitSchema);

export default Unit;
