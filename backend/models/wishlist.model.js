import mongoose from 'mongoose';

const wishlistItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  customFields: {
    type: Map,
    of: String,
    default: {}
  }
});

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    unique: true
  },
  items: [wishlistItemSchema],
  isPublic: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    trim: true,
    maxlength: 100,
    default: 'My Wishlist'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 365*24*60*60*1000) // 1 year from now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster lookups
wishlistSchema.index({ user: 1, 'items.product': 1 });
wishlistSchema.index({ 'items.addedAt': -1 });

// Virtual for item count
wishlistSchema.virtual('itemCount').get(function() {
  return this.items.length;
});

// Method to add item to wishlist
wishlistSchema.methods.addItem = async function(productId, options = {}) {
  const existingItemIndex = this.items.findIndex(
    item => item.product.toString() === productId.toString()
  );

  if (existingItemIndex >= 0) {
    // Update existing item
    this.items[existingItemIndex].addedAt = new Date();
    if (options.notes) this.items[existingItemIndex].notes = options.notes;
    if (options.priority) this.items[existingItemIndex].priority = options.priority;
    if (options.customFields) {
      this.items[existingItemIndex].customFields = {
        ...this.items[existingItemIndex].customFields,
        ...options.customFields
      };
    }
    return this.save();
  }

  // Add new item
  const newItem = {
    product: productId,
    notes: options.notes || '',
    priority: options.priority || 'medium',
    customFields: options.customFields || {}
  };

  this.items.push(newItem);
  return this.save();
};

// Method to remove item from wishlist
wishlistSchema.methods.removeItem = function(productId) {
  const initialLength = this.items.length;
  this.items = this.items.filter(
    item => item.product.toString() !== productId.toString()
  );
  
  if (this.items.length < initialLength) {
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to get or create user's wishlist
wishlistSchema.statics.getUserWishlist = async function(userId) {
  let wishlist = await this.findOne({ user: userId })
    .populate('items.product', 'name price images slug stock')
    .lean();

  if (!wishlist) {
    wishlist = await this.create({ user: userId });
    wishlist = await this.findById(wishlist._id)
      .populate('items.product', 'name price images slug stock')
      .lean();
  }

  return wishlist;
};

// Pre-save hook to handle expiration
wishlistSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
  }
  next();
});

// Pre-remove hook to clean up related data if needed
wishlistSchema.pre('remove', async function(next) {
  // Add any cleanup logic here if needed
  next();
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;
