import mongoose, { Schema, Model } from 'mongoose';

const ProductSchema = new Schema(
  {
    productCode: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    barcode: { type: String, trim: true, index: true, sparse: true },
    nameBn: { type: String, required: true, trim: true, index: true },
    nameEn: { type: String, required: true, trim: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    brand: { type: String, trim: true },
    manufacturer: { type: String, trim: true },
    description: { type: String },
    image: { type: String },
    defaultPurchasePrice: { type: Number, required: true, default: 0 },
    defaultSalePrice: { type: Number, required: true, default: 0 },
    wholesalePrice: { type: Number, default: 0 },
    unit: { type: String, required: true, default: 'kg' },
    packSize: { type: String },
    minimumStock: { type: Number, default: 5 },
    currentStock: { type: Number, default: 0, index: true },
    trackBatch: { type: Boolean, default: true },
    trackExpiry: { type: Boolean, default: true },
    registrationNumber: { type: String, trim: true },
    countryOfOrigin: { type: String, default: 'বাংলাদেশ' },
    active: { type: Boolean, default: true, index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

ProductSchema.index({
  nameBn: 'text',
  nameEn: 'text',
  productCode: 'text',
  barcode: 'text',
  brand: 'text',
});

const Product: Model<any> = mongoose.models.Product || mongoose.model('Product', ProductSchema);

export default Product;
