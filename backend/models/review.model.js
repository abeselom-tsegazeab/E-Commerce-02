import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String
  }],
  isApproved: {
    type: Boolean,
    default: false
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  helpfulCount: {
    type: Number,
    default: 0
  },
  helpfulUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  response: {
    comment: String,
    respondedAt: Date,
    responder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add pagination plugin
reviewSchema.plugin(mongoosePaginate);

// Prevent duplicate reviews from same user
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to get average rating of a product
reviewSchema.statics.getAverageRating = async function(productId) {
  const obj = await this.aggregate([
    {
      $match: { product: productId, isApproved: true }
    },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  try {
    await this.model('Product').findByIdAndUpdate(productId, {
      averageRating: obj[0] ? Math.round(obj[0].averageRating * 10) / 10 : 0,
      reviewCount: obj[0] ? obj[0].reviewCount : 0
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save
reviewSchema.post('save', function() {
  this.constructor.getAverageRating(this.product);
});

// Call getAverageRating after remove
reviewSchema.post('remove', function() {
  this.constructor.getAverageRating(this.product);
});

// Mark review as helpful
reviewSchema.methods.markHelpful = async function(userId) {
  // Check if user already marked this review as helpful
  const userIndex = this.helpfulUsers.indexOf(userId);
  
  if (userIndex === -1) {
    // Add user to helpfulUsers and increment helpfulCount
    this.helpfulUsers.push(userId);
    this.helpfulCount += 1;
    
    // If user previously marked as not helpful, remove from dislikes
    const dislikeIndex = this.dislikes.indexOf(userId);
    if (dislikeIndex !== -1) {
      this.dislikes.splice(dislikeIndex, 1);
    }
    
    await this.save();
    return true;
  }
  
  return false; // User already marked as helpful
};

// Mark review as not helpful
reviewSchema.methods.markNotHelpful = async function(userId) {
  // Check if user already marked this review as not helpful
  const userIndex = this.dislikes.indexOf(userId);
  
  if (userIndex === -1) {
    // Add user to dislikes
    this.dislikes.push(userId);
    
    // If user previously marked as helpful, remove from helpfulUsers and decrement helpfulCount
    const helpfulIndex = this.helpfulUsers.indexOf(userId);
    if (helpfulIndex !== -1) {
      this.helpfulUsers.splice(helpfulIndex, 1);
      this.helpfulCount = Math.max(0, this.helpfulCount - 1);
    }
    
    await this.save();
    return true;
  }
  
  return false; // User already marked as not helpful
};

const Review = mongoose.model('Review', reviewSchema);

export default Review;
