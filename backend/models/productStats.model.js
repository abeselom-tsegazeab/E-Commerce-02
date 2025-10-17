import mongoose from 'mongoose';

const timeSeriesSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  sales: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  addedToCart: { type: Number, default: 0 },
  wishlistAdds: { type: Number, default: 0 },
  shares: { type: Number, default: 0 }
}, { _id: false });

const productStatsSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    required: true,
    index: true
  },
  // Views tracking
  views: {
    daily: { type: Number, default: 0 },
    weekly: { type: Number, default: 0 },
    monthly: { type: Number, default: 0 },
    yearly: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  // Sales tracking
  sales: {
    daily: { type: Number, default: 0 },
    weekly: { type: Number, default: 0 },
    monthly: { type: Number, default: 0 },
    yearly: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    revenue: {
      daily: { type: Number, default: 0 },
      weekly: { type: Number, default: 0 },
      monthly: { type: Number, default: 0 },
      yearly: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    }
  },
  // Conversion rates
  conversion: {
    viewToCart: { type: Number, default: 0 },    // % of views that add to cart
    cartToPurchase: { type: Number, default: 0 }, // % of cart additions that convert to sales
    viewToPurchase: { type: Number, default: 0 }  // Overall conversion rate
  },
  // Inventory
  stock: {
    current: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    isLow: { type: Boolean, default: false }
  },
  // User engagement
  engagement: {
    averageTimeSpent: { type: Number, default: 0 }, // in seconds
    shares: {
      facebook: { type: Number, default: 0 },
      twitter: { type: Number, default: 0 },
      pinterest: { type: Number, default: 0 },
      whatsapp: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    wishlistAdds: { type: Number, default: 0 },
    addedToCart: { type: Number, default: 0 }
  },
  // Ratings and reviews
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  // Time-based data for trends (stores last 30 days by default)
  timeSeries: [timeSeriesSchema],
  // Last updated timestamps
  lastUpdated: {
    daily: { type: Date },
    weekly: { type: Date },
    monthly: { type: Date },
    yearly: { type: Date }
  },
  // For internal use
  _dailyReset: { type: Boolean, default: false },
  _weeklyReset: { type: Boolean, default: false },
  _monthlyReset: { type: Boolean, default: false },
  _yearlyReset: { type: Boolean, default: false }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add compound index for efficient querying
productStatsSchema.index({ product: 1, createdAt: -1 });
productStatsSchema.index({ 'lastUpdated.daily': -1 });
productStatsSchema.index({ 'lastUpdated.weekly': -1 });
productStatsSchema.index({ 'lastUpdated.monthly': -1 });

// Pre-save hook to handle time series data and resets
productStatsSchema.pre('save', function(next) {
  const now = new Date();
  
  // Initialize lastUpdated if not set
  if (!this.lastUpdated) this.lastUpdated = {};
  
  // Handle daily reset
  const lastDaily = this.lastUpdated.daily || now;
  if (!this.isSameDay(lastDaily, now)) {
    if (this._dailyReset !== true) {
      this.views.daily = 0;
      this.sales.daily = 0;
      this.sales.revenue.daily = 0;
      this.engagement.addedToCart = 0;
      this.engagement.wishlistAdds = 0;
      this.engagement.shares = {
        facebook: 0,
        twitter: 0,
        pinterest: 0,
        whatsapp: 0,
        total: 0
      };
      this._dailyReset = true;
    }
  } else {
    this._dailyReset = false;
  }
  
  // Update time series data (keep last 30 days)
  const today = this.startOfDay(now);
  let timeSeriesEntry = this.timeSeries.find(entry => 
    this.isSameDay(entry.date, today)
  );
  
  if (!timeSeriesEntry) {
    timeSeriesEntry = { date: today };
    this.timeSeries.push(timeSeriesEntry);
    
    // Keep only the last 30 days
    if (this.timeSeries.length > 30) {
      this.timeSeries.shift();
    }
  }
  
  // Update time series with current data
  timeSeriesEntry.views = this.views.daily;
  timeSeriesEntry.sales = this.sales.daily;
  timeSeriesEntry.revenue = this.sales.revenue.daily;
  timeSeriesEntry.addedToCart = this.engagement.addedToCart;
  timeSeriesEntry.wishlistAdds = this.engagement.wishlistAdds;
  timeSeriesEntry.shares = this.engagement.shares.total;
  
  // Update last updated timestamps
  this.lastUpdated.daily = now;
  
  // Set weekly reset flag if needed
  if (!this.isSameWeek(this.lastUpdated.weekly || now, now)) {
    this._weeklyReset = true;
  }
  
  // Set monthly reset flag if needed
  if (!this.isSameMonth(this.lastUpdated.monthly || now, now)) {
    this._monthlyReset = true;
  }
  
  // Set yearly reset flag if needed
  if (!this.isSameYear(this.lastUpdated.yearly || now, now)) {
    this._yearlyReset = true;
  }
  
  next();
});

// Helper methods
productStatsSchema.methods.isSameDay = function(date1, date2) {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
};

productStatsSchema.methods.isSameWeek = function(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  // Set to start of week (Sunday)
  d1.setHours(0, 0, 0, 0 - (d1.getDay() * 86400000));
  d2.setHours(0, 0, 0, 0 - (d2.getDay() * 86400000));
  
  return d1.getTime() === d2.getTime();
};

productStatsSchema.methods.isSameMonth = function(date1, date2) {
  return date1.getMonth() === date2.getMonth() && 
         date1.getFullYear() === date2.getFullYear();
};

productStatsSchema.methods.isSameYear = function(date1, date2) {
  return date1.getFullYear() === date2.getFullYear();
};

productStatsSchema.methods.startOfDay = function(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Static method to get or create stats for a product
productStatsSchema.statics.getOrCreate = async function(productId) {
  let stats = await this.findOne({ product: productId });
  
  if (!stats) {
    stats = new this({ product: productId });
    await stats.save();
  }
  
  return stats;
};

const ProductStats = mongoose.model('ProductStats', productStatsSchema);

export default ProductStats;
