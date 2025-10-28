import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  // Reference to the user in your application
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Stripe subscription ID
  stripeSubscriptionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Stripe customer ID
  stripeCustomerId: {
    type: String,
    required: true,
    index: true
  },
  
  // Subscription status (active, trialing, past_due, canceled, or unpaid)
  status: {
    type: String,
    required: true,
    enum: ['incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid']
  },
  
  // Subscription plan details
  plan: {
    priceId: {
      type: String,
      required: true
    },
    productId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    interval: {
      type: String,
      enum: ['day', 'week', 'month', 'year'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'usd'
    }
  },
  
  // Billing cycle details
  currentPeriodStart: {
    type: Date,
    required: true
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  
  // Trial information
  trialStart: Date,
  trialEnd: Date,
  
  // Cancellation details
  canceledAt: Date,
  cancellationReason: String,
  
  // Payment method details
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_account', 'other'],
    default: 'card'
  },
  
  // Metadata for additional information
  metadata: {
    type: Map,
    of: String,
    default: {}
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ 'plan.productId': 1, status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

// Pre-save hook to update the updatedAt timestamp
subscriptionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function() {
  return ['trialing', 'active'].includes(this.status);
});

// Virtual for checking if subscription is in trial
subscriptionSchema.virtual('inTrial').get(function() {
  if (!this.trialStart || !this.trialEnd) return false;
  const now = new Date();
  return now >= this.trialStart && now <= this.trialEnd;
});

// Static method to find active subscriptions for a user
subscriptionSchema.statics.findActiveForUser = function(userId) {
  return this.find({
    userId,
    status: { $in: ['trialing', 'active'] },
    currentPeriodEnd: { $gt: new Date() }
  });
};

// Static method to find expiring subscriptions
subscriptionSchema.statics.findExpiring = function(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  
  return this.find({
    status: 'active',
    currentPeriodEnd: { $lte: date },
    $or: [
      { 'metadata.notificationSent': { $exists: false } },
      { 'metadata.notificationSent': { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Not notified in last 24h
    ]
  });
};

// Create and export the model
const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
