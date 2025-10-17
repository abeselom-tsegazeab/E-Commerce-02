import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  logo: {
    type: String,
    required: true
  },
  description: String,
  website: String,
  isActive: {
    type: Boolean,
    default: true
  },
  // SEO fields
  metaTitle: String,
  metaDescription: String,
  metaKeywords: [String]
}, {
  timestamps: true
});

// Add text index for search
brandSchema.index({ name: 'text', description: 'text' });

const Brand = mongoose.model('Brand', brandSchema);

export default Brand;
