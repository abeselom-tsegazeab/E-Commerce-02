import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
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
  description: String,
  image: String,
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // For hierarchical categories
  ancestors: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      index: true
    },
    name: String,
    slug: String
  }],
  // For sorting
  order: {
    type: Number,
    default: 0
  },
  // SEO fields
  metaTitle: String,
  metaDescription: String,
  metaKeywords: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for child categories
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Add text index for search
categorySchema.index({ name: 'text', description: 'text' });

const Category = mongoose.model('Category', categorySchema);

export default Category;
