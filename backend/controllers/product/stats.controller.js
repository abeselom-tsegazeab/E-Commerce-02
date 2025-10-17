import ProductStats from '../../models/productStats.model.js';
import Product from '../../models/product.model.js';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';

// Helper function to get time ranges
const getTimeRanges = () => {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;
  const oneMonth = 30 * oneDay;
  const oneYear = 365 * oneDay;
  
  return {
    today: new Date(now.setHours(0, 0, 0, 0)),
    yesterday: new Date(now - oneDay),
    lastWeek: new Date(now - oneWeek),
    lastMonth: new Date(now - oneMonth),
    lastYear: new Date(now - oneYear),
    startOfWeek: new Date(now.setDate(now.getDate() - now.getDay())),
    startOfMonth: new Date(now.getFullYear(), now.getMonth(), 1),
    startOfYear: new Date(now.getFullYear(), 0, 1)
  };
};

/**
 * @desc    Record a product view
 * @route   POST /api/products/:id/view
 * @access  Public
 */
export const recordProductView = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }

  // Find the product to ensure it exists
  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Get or create stats for this product
  const stats = await ProductStats.getOrCreate(id);
  
  // Update view counts
  stats.views.daily += 1;
  stats.views.weekly += 1;
  stats.views.monthly += 1;
  stats.views.yearly += 1;
  stats.views.total += 1;
  
  // Update conversion rates
  if (stats.engagement.addedToCart > 0) {
    stats.conversion.viewToCart = Number(
      ((stats.engagement.addedToCart / stats.views.total) * 100).toFixed(2)
    );
  }
  
  await stats.save();
  
  res.status(200).json({
    success: true,
    message: 'Product view recorded',
    data: {
      views: stats.views.total,
      dailyViews: stats.views.daily
    }
  });
});

/**
 * @desc    Record a product added to cart
 * @route   POST /api/products/:id/cart-add
 * @access  Private
 */
export const recordAddToCart = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }

  // Get or create stats for this product
  const stats = await ProductStats.getOrCreate(id);
  
  // Update cart additions
  stats.engagement.addedToCart += 1;
  
  // Update conversion rates
  if (stats.views.total > 0) {
    stats.conversion.viewToCart = Number(
      ((stats.engagement.addedToCart / stats.views.total) * 100).toFixed(2)
    );
  }
  
  await stats.save();
  
  res.status(200).json({
    success: true,
    message: 'Cart addition recorded',
    data: {
      addedToCart: stats.engagement.addedToCart
    }
  });
});

/**
 * @desc    Record a product sale
 * @route   POST /api/products/:id/sale
 * @access  Private (should be called from order service)
 */
export const recordProductSale = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity = 1, amount = 0 } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }

  // Get or create stats for this product
  const stats = await ProductStats.getOrCreate(id);
  
  // Update sales counts
  stats.sales.daily += quantity;
  stats.sales.weekly += quantity;
  stats.sales.monthly += quantity;
  stats.sales.yearly += quantity;
  stats.sales.total += quantity;
  
  // Update revenue
  stats.sales.revenue.daily += amount;
  stats.sales.revenue.weekly += amount;
  stats.sales.revenue.monthly += amount;
  stats.sales.revenue.yearly += amount;
  stats.sales.revenue.total += amount;
  
  // Update conversion rates
  if (stats.engagement.addedToCart > 0) {
    stats.conversion.cartToPurchase = Number(
      ((stats.sales.total / stats.engagement.addedToCart) * 100).toFixed(2)
    );
  }
  
  if (stats.views.total > 0) {
    stats.conversion.viewToPurchase = Number(
      ((stats.sales.total / stats.views.total) * 100).toFixed(2)
    );
  }
  
  await stats.save();
  
  res.status(200).json({
    success: true,
    message: 'Product sale recorded',
    data: {
      totalSales: stats.sales.total,
      totalRevenue: stats.sales.revenue.total
    }
  });
});

/**
 * @desc    Record a product share
 * @route   POST /api/products/:id/share
 * @access  Public
 */
export const recordProductShare = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { platform = 'other' } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }

  // Get or create stats for this product
  const stats = await ProductStats.getOrCreate(id);
  
  // Update share count for the specific platform and total
  if (stats.engagement.shares[platform] !== undefined) {
    stats.engagement.shares[platform] += 1;
    stats.engagement.shares.total += 1;
  }
  
  await stats.save();
  
  res.status(200).json({
    success: true,
    message: 'Product share recorded',
    data: {
      shares: stats.engagement.shares
    }
  });
});

/**
 * @desc    Record a product added to wishlist
 * @route   POST /api/products/:id/wishlist-add
 * @access  Private
 */
export const recordWishlistAdd = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }

  // Get or create stats for this product
  const stats = await ProductStats.getOrCreate(id);
  
  // Update wishlist count
  stats.engagement.wishlistAdds += 1;
  
  await stats.save();
  
  res.status(200).json({
    success: true,
    message: 'Wishlist addition recorded',
    data: {
      wishlistAdds: stats.engagement.wishlistAdds
    }
  });
});

/**
 * @desc    Get product statistics
 * @route   GET /api/products/:id/stats
 * @access  Public
 */
export const getProductStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { period = 'all' } = req.query; // all, day, week, month, year
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }

  // Get stats for this product
  const stats = await ProductStats.findOne({ product: id });
  
  if (!stats) {
    return res.status(404).json({
      success: false,
      message: 'No statistics found for this product'
    });
  }
  
  // Prepare response data based on the requested period
  let responseData = {
    views: stats.views.total,
    sales: stats.sales.total,
    revenue: stats.sales.revenue.total,
    conversion: stats.conversion,
    ratings: stats.ratings,
    engagement: {
      wishlistAdds: stats.engagement.wishlistAdds,
      addedToCart: stats.engagement.addedToCart,
      shares: stats.engagement.shares,
      averageTimeSpent: stats.engagement.averageTimeSpent
    },
    stock: stats.stock
  };
  
  // Filter time series data based on period
  if (period !== 'all') {
    const { today, lastWeek, lastMonth, lastYear } = getTimeRanges();
    let fromDate;
    
    switch (period) {
      case 'day':
        fromDate = today;
        responseData.views = stats.views.daily;
        responseData.sales = stats.sales.daily;
        responseData.revenue = stats.sales.revenue.daily;
        break;
      case 'week':
        fromDate = lastWeek;
        responseData.views = stats.views.weekly;
        responseData.sales = stats.sales.weekly;
        responseData.revenue = stats.sales.revenue.weekly;
        break;
      case 'month':
        fromDate = lastMonth;
        responseData.views = stats.views.monthly;
        responseData.sales = stats.sales.monthly;
        responseData.revenue = stats.sales.revenue.monthly;
        break;
      case 'year':
        fromDate = lastYear;
        responseData.views = stats.views.yearly;
        responseData.sales = stats.sales.yearly;
        responseData.revenue = stats.sales.revenue.yearly;
        break;
      default:
        fromDate = null;
    }
    
    if (fromDate) {
      responseData.timeSeries = stats.timeSeries.filter(
        entry => new Date(entry.date) >= fromDate
      );
    }
  } else {
    responseData.timeSeries = stats.timeSeries;
  }
  
  res.status(200).json({
    success: true,
    data: responseData
  });
});

/**
 * @desc    Get top performing products
 * @route   GET /api/products/stats/top
 * @access  Public
 */
export const getTopProducts = asyncHandler(async (req, res) => {
  const { 
    limit = 10, 
    sortBy = 'sales', // sales, revenue, views, rating
    period = 'all' // all, day, week, month, year
  } = req.query;
  
  // Build the sort field based on period
  let sortField;
  switch (sortBy) {
    case 'sales':
      sortField = period === 'all' ? 'sales.total' : 
                 period === 'day' ? 'sales.daily' :
                 period === 'week' ? 'sales.weekly' :
                 period === 'month' ? 'sales.monthly' : 'sales.yearly';
      break;
    case 'revenue':
      sortField = period === 'all' ? 'sales.revenue.total' : 
                 period === 'day' ? 'sales.revenue.daily' :
                 period === 'week' ? 'sales.revenue.weekly' :
                 period === 'month' ? 'sales.revenue.monthly' : 'sales.revenue.yearly';
      break;
    case 'views':
      sortField = period === 'all' ? 'views.total' : 
                 period === 'day' ? 'views.daily' :
                 period === 'week' ? 'views.weekly' :
                 period === 'month' ? 'views.monthly' : 'views.yearly';
      break;
    case 'rating':
      sortField = 'ratings.average';
      break;
    default:
      sortField = 'sales.total';
  }
  
  // Build the aggregation pipeline
  const pipeline = [
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productData'
      }
    },
    { $unwind: '$productData' },
    {
      $project: {
        _id: 0,
        product: {
          id: '$product',
          name: '$productData.name',
          price: '$productData.price',
          image: '$productData.primaryImage'
        },
        sales: {
          total: '$sales.total',
          daily: '$sales.daily',
          weekly: '$sales.weekly',
          monthly: '$sales.monthly',
          yearly: '$sales.yearly',
          revenue: {
            total: '$sales.revenue.total',
            daily: '$sales.revenue.daily',
            weekly: '$sales.revenue.weekly',
            monthly: '$sales.revenue.monthly',
            yearly: '$sales.revenue.yearly'
          }
        },
        views: {
          total: '$views.total',
          daily: '$views.daily',
          weekly: '$views.weekly',
          monthly: '$views.monthly',
          yearly: '$views.yearly'
        },
        ratings: {
          average: '$ratings.average',
          count: '$ratings.count'
        },
        conversion: '$conversion',
        lastUpdated: '$updatedAt'
      }
    },
    { $sort: { [sortField]: -1 } },
    { $limit: parseInt(limit, 10) }
  ];
  
  // If filtering by period, we need to match the period data
  if (period !== 'all') {
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = null;
    }
    
    if (startDate) {
      pipeline.unshift({
        $match: {
          'lastUpdated.daily': { $gte: startDate }
        }
      });
    }
  }
  
  const topProducts = await ProductStats.aggregate(pipeline);
  
  res.status(200).json({
    success: true,
    count: topProducts.length,
    data: topProducts
  });
});

/**
 * @desc    Get sales analytics
 * @route   GET /api/products/stats/analytics
 * @access  Private/Admin
 */
export const getSalesAnalytics = asyncHandler(async (req, res) => {
  const { 
    period = 'month', // day, week, month, year
    limit = 12 // Number of periods to return
  } = req.query;
  
  // Calculate date range based on period
  const now = new Date();
  let startDate;
  let groupFormat;
  
  switch (period) {
    case 'day':
      // Last 30 days by hour
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      groupFormat = {
        year: { $year: '$date' },
        month: { $month: '$date' },
        day: { $dayOfMonth: '$date' },
        hour: { $hour: '$date' }
      };
      break;
    case 'week':
      // Last 12 weeks by day
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - (12 * 7));
      groupFormat = {
        year: { $year: '$date' },
        week: { $week: '$date' }
      };
      break;
    case 'year':
      // Last 5 years by month
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 5);
      groupFormat = {
        year: { $year: '$date' }
      };
      break;
    case 'month':
    default:
      // Last 12 months by day
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 12);
      groupFormat = {
        year: { $year: '$date' },
        month: { $month: '$date' },
        day: { $dayOfMonth: '$date' }
      };
  }
  
  // Get all time series data for the period
  const pipeline = [
    {
      $match: {
        'timeSeries.date': { $gte: startDate }
      }
    },
    { $unwind: '$timeSeries' },
    {
      $match: {
        'timeSeries.date': { $gte: startDate }
      }
    },
    {
      $group: {
        _id: groupFormat,
        date: { $first: '$timeSeries.date' },
        views: { $sum: '$timeSeries.views' },
        sales: { $sum: '$timeSeries.sales' },
        revenue: { $sum: '$timeSeries.revenue' },
        addedToCart: { $sum: '$timeSeries.addedToCart' },
        wishlistAdds: { $sum: '$timeSeries.wishlistAdds' },
        shares: { $sum: '$timeSeries.shares' },
        productCount: { $addToSet: '$_id' }
      }
    },
    {
      $project: {
        _id: 0,
        date: 1,
        views: 1,
        sales: 1,
        revenue: 1,
        addedToCart: 1,
        wishlistAdds: 1,
        shares: 1,
        productCount: { $size: '$productCount' },
        // Calculate averages per product
        avgViews: { $divide: ['$views', { $size: '$productCount' }] },
        avgSales: { $divide: ['$sales', { $size: '$productCount' }] },
        avgRevenue: { $divide: ['$revenue', { $size: '$productCount' }] }
      }
    },
    { $sort: { date: 1 } },
    { $limit: parseInt(limit, 10) * (period === 'day' ? 24 : period === 'year' ? 12 : 30) }
  ];
  
  const analytics = await ProductStats.aggregate(pipeline);
  
  // Process data for charts
  const labels = [];
  const viewsData = [];
  const salesData = [];
  const revenueData = [];
  const conversionData = [];
  
  analytics.forEach(item => {
    const date = new Date(item.date);
    let label;
    
    switch (period) {
      case 'day':
        label = date.toLocaleTimeString([], { hour: '2-digit' });
        break;
      case 'week':
        label = date.toLocaleDateString([], { weekday: 'short' });
        break;
      case 'year':
        label = date.toLocaleDateString([], { month: 'short' });
        break;
      case 'month':
      default:
        label = date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    }
    
    labels.push(label);
    viewsData.push(item.views);
    salesData.push(item.sales);
    revenueData.push(item.revenue);
    
    // Calculate conversion rate (views to sales)
    const conversionRate = item.views > 0 
      ? (item.sales / item.views) * 100 
      : 0;
    conversionData.push(Number(conversionRate.toFixed(2)));
  });
  
  res.status(200).json({
    success: true,
    data: {
      period,
      labels,
      datasets: {
        views: viewsData,
        sales: salesData,
        revenue: revenueData,
        conversion: conversionData
      },
      summary: {
        totalViews: analytics.reduce((sum, item) => sum + item.views, 0),
        totalSales: analytics.reduce((sum, item) => sum + item.sales, 0),
        totalRevenue: analytics.reduce((sum, item) => sum + item.revenue, 0),
        avgConversion: conversionData.length > 0 
          ? (conversionData.reduce((a, b) => a + b, 0) / conversionData.length).toFixed(2)
          : 0,
        productsTracked: analytics.length > 0 ? analytics[0].productCount : 0
      }
    }
  });
});

/**
 * @desc    Update product inventory
 * @route   PATCH /api/products/:id/inventory
 * @access  Private/Admin
 */
export const updateProductInventory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity, lowStockThreshold } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }
  
  // Find the product to ensure it exists
  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  // Get or create stats for this product
  const stats = await ProductStats.getOrCreate(id);
  
  // Update inventory
  if (quantity !== undefined) {
    stats.stock.current = quantity;
    
    // Check if stock is low
    const threshold = lowStockThreshold !== undefined 
      ? lowStockThreshold 
      : stats.stock.lowStockThreshold;
      
    stats.stock.isLow = quantity <= threshold;
    
    if (lowStockThreshold !== undefined) {
      stats.stock.lowStockThreshold = lowStockThreshold;
    }
  }
  
  await stats.save();
  
  res.status(200).json({
    success: true,
    message: 'Product inventory updated',
    data: {
      inventory: {
        current: stats.stock.current,
        isLow: stats.stock.isLow,
        lowStockThreshold: stats.stock.lowStockThreshold
      }
    }
  });
});

/**
 * @desc    Update product rating
 * @route   PATCH /api/products/:id/rating
 * @access  Private
 */
export const updateProductRating = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }
  
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5'
    });
  }
  
  // Get or create stats for this product
  const stats = await ProductStats.getOrCreate(id);
  
  // Update rating distribution
  const ratingKey = Math.floor(rating);
  stats.ratings.distribution[ratingKey] = (stats.ratings.distribution[ratingKey] || 0) + 1;
  
  // Calculate new average rating
  const totalRatings = Object.values(stats.ratings.distribution).reduce((a, b) => a + b, 0);
  const sumRatings = Object.entries(stats.ratings.distribution)
    .reduce((sum, [key, count]) => sum + (parseInt(key) * count), 0);
  
  stats.ratings.count = totalRatings;
  stats.ratings.average = sumRatings / totalRatings;
  
  await stats.save();
  
  res.status(200).json({
    success: true,
    message: 'Product rating updated',
    data: {
      averageRating: stats.ratings.average,
      totalRatings: stats.ratings.count,
      distribution: stats.ratings.distribution
    }
  });
});

/**
 * @desc    Record time spent on product page
 * @route   POST /api/products/:id/time-spent
 * @access  Private
 */
export const recordTimeSpent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { duration } = req.body; // in seconds
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }
  
  if (!duration || typeof duration !== 'number' || duration <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid duration is required'
    });
  }
  
  // Get or create stats for this product
  const stats = await ProductStats.getOrCreate(id);
  
  // Update average time spent (exponential moving average)
  const alpha = 0.3; // Smoothing factor
  const currentAvg = stats.engagement.averageTimeSpent || 0;
  const newAvg = (alpha * duration) + ((1 - alpha) * currentAvg);
  
  stats.engagement.averageTimeSpent = newAvg;
  await stats.save();
  
  res.status(200).json({
    success: true,
    message: 'Time spent recorded',
    data: {
      averageTimeSpent: stats.engagement.averageTimeSpent
    }
  });
});
