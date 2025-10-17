import mongoose from 'mongoose';

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
  response: {
    comment: String,
    respondedAt: Date,
    responder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

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

const Review = mongoose.model('Review', reviewSchema);

export default Review;
