import mongoose from "mongoose";

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
    
    /** @type {OrderItem[]} List of ordered products */
    products: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },
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
      name: {
        type: String,
        required: true
      },
      image: {
        type: String
      },
      variant: {
        type: String
      }
    }],
    
    /** @type {number} Total order amount */
    totalAmount: {
      type: Number,
      required: true,
      min: 0
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
      type: String,
      index: true
    },
    
    /** @type {string} Shipping carrier */
    shippingCarrier: {
      type: String,
      enum: ['ups', 'fedex', 'usps', 'dhl', 'other'],
      default: 'other'
    },
    
    /** @type {string} Customer notes */
    customerNotes: {
      type: String
    },
    
    /** @type {boolean} Whether the order is a guest checkout */
    isGuest: {
      type: Boolean,
      default: false
    },
    
    /** @type {string} Guest customer email */
    guestEmail: {
      type: String,
      validate: {
        validator: function(v) {
          // Only required if isGuest is true
          return !this.isGuest || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: props => `${props.value} is not a valid email`
      },
      index: true,
      sparse: true
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'shippingAddress.city': 1 });
orderSchema.index({ 'shippingAddress.country': 1 });

/**
 * Pre-save hook to update product inventory
 */
orderSchema.pre('save', async function(next) {
  // Only run this hook if the status is being modified to 'cancelled' or 'refunded'
  if (this.isModified('status') && ['cancelled', 'refunded'].includes(this.status)) {
    // Here you would add logic to update inventory
    // This is a placeholder for the actual implementation
    console.log(`Order ${this._id} was ${this.status}. Update inventory here.`);
  }
  next();
});

/**
 * Calculate order total before saving
 */
orderSchema.pre('save', function(next) {
  if (this.isModified('products')) {
    this.totalAmount = this.products.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }
  next();
});

// Virtual for formatted order number
orderSchema.virtual('orderNumber').get(function() {
  return `ORD-${this._id.toString().substr(-8).toUpperCase()}`;
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
