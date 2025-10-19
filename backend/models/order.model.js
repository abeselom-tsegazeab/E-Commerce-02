import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';

/**
 * @typedef {Object} OrderItem
 * @property {mongoose.Types.ObjectId} product - Reference to the Product model
 * @property {number} quantity - Quantity of the product
 * @property {number} price - Price per unit at time of purchase
 * @property {string} [name] - Product name at time of purchase
 * @property {string} [image] - Product image at time of purchase
 * @property {string} [variant] - Selected variant if applicable
 */

/**
 * @typedef {Object} Address
 * @property {string} street - Street address
 * @property {string} city - City name
 * @property {string} state - State/Province/Region
 * @property {string} postalCode - Postal/ZIP code
 * @property {string} country - Country name
 */

const orderSchema = new mongoose.Schema(
  {
    /** @type {mongoose.Types.ObjectId} Reference to User model */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    
    /** @type {OrderItem[]} List of ordered items */
    items: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: [true, 'Product ID is required'],
        validate: {
          validator: function(v) {
            return mongoose.Types.ObjectId.isValid(v);
          },
          message: props => `${props.value} is not a valid product ID`
        }
      },
      quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
      },
      price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
      },
      name: {
        type: String,
        required: [true, 'Product name is required']
      },
      image: {
        type: String,
        default: ''
      },
      variant: {
        type: String,
        default: ''
      },
      sku: String,
      weight: Number,
      tax: {
        type: Number,
        default: 0
      },
      discount: {
        type: Number,
        default: 0
      },
      total: {
        type: Number,
        default: function() {
          return (this.quantity * this.price) - (this.discount || 0);
        }
      }
    }],

    /** @type {Array} Legacy products field for backward compatibility */
    products: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      quantity: Number,
      price: Number,
      name: String,
      image: String,
      variant: String,
      sku: String,
      weight: Number,
      tax: {
        type: Number,
        default: 0
      },
      discount: {
        type: Number,
        default: 0
      }
    }],
    
    /** @type {number} Total order amount */
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
      default: function() {
        // Calculate total from items if not provided
        return this.items.reduce((total, item) => {
          return total + (item.quantity * item.price) - (item.discount || 0);
        }, 0);
      }
    },
    
    /** @type {string} Stripe session ID for payment */
    stripeSessionId: {
      type: String,
      index: true,
      sparse: true
    },
    
    /** @type {string} Order status */
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
      index: true
    },
    
    /** @type {string} Payment status */
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending'
    },
    
    /** @type {Address} Shipping address */
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true }
    },
    
    /** @type {string} Tracking number for shipping */
    trackingNumber: {
      type: String
    },
    
    /** @type {string} Customer notes */
    notes: {
      type: String
    },
    
    /** @type {boolean} Whether the order is a guest order */
    isGuest: {
      type: Boolean,
      default: false
    },
    
    /** @type {string} Guest email (for guest orders) */
    guestEmail: {
      type: String,
      validate: {
        validator: function(v) {
          // Only validate if this is a guest order
          if (!this.isGuest) return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: props => `${props.value} is not a valid email`
      },
      index: true,
      sparse: true
    },

    /** @type {Array} Return requests */
    returns: [{
      returnId: {
        type: String,
        required: true,
        unique: true
      },
      status: {
        type: String,
        enum: ['requested', 'approved', 'rejected', 'processing', 'completed'],
        default: 'requested'
      },
      reason: {
        type: String,
        required: true
      },
      items: [{
        orderItemId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Order.items'
        },
        name: String,
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        price: {
          type: Number,
          required: true,
          min: 0
        },
        reason: String,
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected', 'received', 'refunded'],
          default: 'pending'
        },
        processedAt: Date
      }],
      requestedAt: {
        type: Date,
        default: Date.now
      },
      processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      processedAt: Date,
      notes: [{
        text: String,
        createdAt: {
          type: Date,
          default: Date.now
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      }],
      returnDeadline: Date,
      remainingReturnWindowDays: Number
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add pre-save middleware to sync items and products
orderSchema.pre('save', function(next) {
  // If items is modified, update products for backward compatibility
  if (this.isModified('items') && this.items) {
    this.products = this.items.map(item => ({
      product: item.product,
      quantity: item.quantity,
      price: item.price,
      name: item.name,
      image: item.image,
      variant: item.variant,
      sku: item.sku,
      weight: item.weight,
      tax: item.tax,
      discount: item.discount
    }));
  }
  // If products is modified, update items
  else if (this.isModified('products') && this.products) {
    this.items = this.products.map(product => ({
      product: product.product,
      quantity: product.quantity,
      price: product.price,
      name: product.name,
      image: product.image,
      variant: product.variant,
      sku: product.sku,
      weight: product.weight,
      tax: product.tax,
      discount: product.discount,
      total: (product.quantity * product.price) - (product.discount || 0)
    }));
  }
  next();
});

// Add virtual for backward compatibility
orderSchema.virtual('productsArray', {
  ref: 'Product',
  localField: 'items.product',
  foreignField: '_id'
});

// Add pagination plugin to the schema
orderSchema.plugin(mongoosePaginate);

const Order = mongoose.model("Order", orderSchema);

export default Order;