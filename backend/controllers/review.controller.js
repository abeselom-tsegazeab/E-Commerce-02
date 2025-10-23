import mongoose from 'mongoose';
import Review from '../models/review.model.js';
import Product from '../models/product.model.js';

export const createReview = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request params:', req.params);
    console.log('Authenticated user:', req.user);
    
    const { rating, title, comment, images = [] } = req.body;
    const { productId } = req.params;
    
    if (!req.user || !req.user._id) {
      console.error('No user found in request. Request user:', req.user);
      return res.status(401).json({
        success: false,
        message: 'User not authenticated - No user ID found in request'
      });
    }
    
    // Ensure we have a valid user ID
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Invalid user ID format:', userId);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Validate required fields
    if (!rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Rating, title, and comment are required'
      });
    }

    // Check if product exists and is active
    const product = await Product.findOne({
      _id: productId,
      isActive: true
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or not available for review'
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: userId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Create and save the review
    const review = new Review({
      product: productId,
      user: userId, // Make sure this is a valid ObjectId
      rating: parseInt(rating, 10),
      title: title.trim(),
      comment: comment.trim(),
      images: Array.isArray(images) ? images : [],
      isApproved: false, // Default to false, admin can approve later
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Creating review with data:', {
      product: productId,
      user: userId,
      rating: parseInt(rating, 10),
      title: title.trim(),
      comment: comment.trim(),
      images: Array.isArray(images) ? images : []
    });

    const savedReview = await review.save();
    
    // Populate user details for the response
    const populatedReview = await Review.findById(savedReview._id)
      .populate('user', 'name email avatar')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully and pending approval',
      data: populatedReview
    });
  } catch (error) {
    console.error('Error creating review:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    let { page = 1, limit = 10, sort = '-createdAt' } = req.query;

    // Convert to numbers and validate
    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

    // Check if product exists
    const product = await Product.findById(productId).select('_id');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const options = {
      page,
      limit,
      sort,
      lean: true,
      populate: [
        { 
          path: 'user', 
          select: 'name email avatar',
          options: { lean: true }
        }
      ]
    };

    const query = { 
      product: productId, 
      isApproved: true 
    };

    // Use the paginate method from mongoose-paginate-v2
    const result = await Review.paginate(query, options);

    res.json({
      success: true,
      data: result.docs,
      pagination: {
        total: result.totalDocs,
        pages: result.totalPages,
        page: result.page,
        limit: result.limit,
        hasNextPage: result.hasNextPage
      }
    });

  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update review
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment, images } = req.body;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if the user is the owner or an admin
    if (review.user.toString() !== userId.toString() && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    // Update the review
    const updates = {};
    if (rating !== undefined) updates.rating = rating;
    if (title) updates.title = title.trim();
    if (comment) updates.comment = comment.trim();
    if (images) updates.images = Array.isArray(images) ? images : [];
    updates.updatedAt = new Date();

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    });
  } catch (error) {
    console.error('Error updating review:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating review'
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const isAdmin = req.user.role === 'admin';
    
    // Build the query
    const query = isAdmin 
      ? { _id: reviewId } // Admin can delete any review
      : { _id: reviewId, user: userId }; // Regular users can only delete their own reviews
    
    const review = await Review.findOneAndDelete(query);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or not authorized'
      });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.markHelpful(userId);

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const markNotHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.markNotHelpful(userId);

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getReviewStats = async (req, res) => {
  try {
    const { productId } = req.params;

    const stats = await Review.aggregate([
      {
        $match: { product: mongoose.Types.ObjectId(productId), isApproved: true }
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);

    const totalReviews = stats.reduce((sum, stat) => sum + stat.count, 0);
    const averageRating = stats.reduce(
      (sum, stat) => sum + stat._id * stat.count,
      0
    ) / totalReviews || 0;

    res.json({
      success: true,
      data: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
