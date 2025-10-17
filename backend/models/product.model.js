import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be a positive number'],
      set: val => Math.round(val * 100) / 100 // Ensure 2 decimal places
    },
    comparePrice: {
      type: Number,
      min: 0,
      validate: {
        validator: function(value) {
          return value > this.price;
        },
        message: 'Compare price must be greater than the regular price'
      }
    },
    images: [{
      url: {
        type: String,
        required: true
      },
      altText: {
        type: String,
        default: ''
      },
      isPrimary: {
        type: Boolean,
        default: false
      },
      order: {
        type: Number,
        default: 0
      }
    }],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required']
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    quantity: {
      type: Number,
      required: [true, 'Product quantity is required'],
      min: [0, 'Quantity cannot be negative']
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    weight: {
      value: {
        type: Number,
        min: 0
      },
      unit: {
        type: String,
        enum: ['g', 'kg', 'lb', 'oz'],
        default: 'g'
      }
    },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      unit: {
        type: String,
        enum: ['mm', 'cm', 'in'],
        default: 'cm'
      }
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    // SEO fields
    metaTitle: String,
    metaDescription: String,
    // Statistics
    viewCount: {
      type: Number,
      default: 0
    },
    purchaseCount: {
      type: Number,
      default: 0
    },
    // Vendor/Inventory
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Product variants
    hasVariants: {
      type: Boolean,
      default: false
    },
    variants: [{
      sku: String,
      options: [{
        name: String,  // e.g., 'Color', 'Size'
        value: String  // e.g., 'Red', 'XL'
      }],
      price: Number,
      comparePrice: Number,
      quantity: Number,
      images: [String],
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    // Product specifications
    specifications: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },
    // Users waiting for stock alerts
    watchingUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    // Inventory management
    inventory: {
      quantity: {
        type: Number,
        required: true,
        default: 0
      },
      sku: String,
      barcode: String,
      isLowStockAlertSent: {
        type: Boolean,
        default: false
      },
      wasOutOfStock: {
        type: Boolean,
        default: false
      },
      isBackInStockAlertSent: {
        type: Boolean,
        default: true // Start as true to avoid false alerts
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for getting the primary image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : (this.images[0]?.url || null);
});

// Add text index for search
productSchema.index({
  name: 'text',
  description: 'text',
  'variants.options.value': 'text',
  tags: 'text'
});

// Create slug from name before saving
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  next();
});

// Auto-generate SKU if not provided
productSchema.pre('save', function(next) {
  if (!this.sku) {
    this.sku = `SKU-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

// Add pagination plugin to the schema
productSchema.plugin(mongoosePaginate);

const Product = mongoose.model("Product", productSchema);

export default Product;
