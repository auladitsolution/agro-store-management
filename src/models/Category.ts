import mongoose, { Schema, Model } from 'mongoose';

const CategorySchema = new Schema(
  {
    nameBn: { type: String, required: true, trim: true, index: true },
    nameEn: { type: String, required: true, trim: true, index: true },
    description: { type: String },
    image: { type: String },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const Category: Model<any> = mongoose.models.Category || mongoose.model('Category', CategorySchema);

export default Category;
