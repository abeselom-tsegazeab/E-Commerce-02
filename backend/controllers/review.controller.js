import Review from '../models/review.model.js';
import Product from '../models/product.model.js';

export const createReview = async (req, res) => {
  try {
    const { rating, title, comment, images = [] } = req.body;
    const { productId } = req.params;
    const userId = req.user._id;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
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

    const review = new Review({
      product: productId,
      user: userId,
      rating,
      title,
      comment,
      images,
      isApproved: false // Default to false, admin can approve later
    });

    await review.save();

    res.status(201).json({
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

export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort,
      populate: [
        { path: 'user', select: 'name email avatar' },
        { path: 'product', select: 'name images' }
      ]
    };

    const reviews = await Review.paginate(
      { product: productId, isApproved: true },
      options
    );

    res.json({
      success: true,
      data: reviews.docs,
      pagination: {
        total: reviews.totalDocs,
        pages: reviews.totalPages,
        page: reviews.page,
        limit: reviews.limit
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment, images } = req.body;
    const userId = req.user._id;

    const review = await Review.findOneAndUpdate(
      { _id: reviewId, user: userId },
      { rating, title, comment, images, isApproved: false },
      { new: true, runValidators: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or not authorized'
      });
    }

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

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await Review.findOneAndDelete({
      _id: reviewId,
      $or: [
        { user: userId },
        { isAdmin: true } // Allow admins to delete any review
      ]
    });

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
