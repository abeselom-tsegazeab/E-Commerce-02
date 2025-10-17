import mongoose from 'mongoose';
import slugify from 'slugify';

const attributeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Attribute name is required'],
    trim: true,
    maxlength: [100, 'Attribute name cannot exceed 100 characters'],
    unique: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  type: {
    type: String,
    enum: ['text', 'number', 'select', 'multiselect', 'boolean', 'date'],
    default: 'text',
    required: true
  },
  values: [{
    value: {
      type: String,
      required: true,
      trim: true
    },
    label: String,
    color: String,
    isDefault: Boolean
  }],
  isFilterable: {
    type: Boolean,
    default: false
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  isVariant: {
    type: Boolean,
    default: false
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    trim: true
  },
  validation: {
    min: Number,
    max: Number,
    pattern: String,
    errorMessage: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate slug from name before saving
attributeSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Add text index for search
attributeSchema.index({ name: 'text', description: 'text' });

const Attribute = mongoose.model('Attribute', attributeSchema);

export default Attribute;
