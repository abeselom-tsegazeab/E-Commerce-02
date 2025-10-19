import express from 'express';
import { adminRoute, protectRoute } from '../middleware/auth.middleware.js';
import { getAnalyticsData, getDailySalesData } from '../controllers/analytics.controller.js';

/**
 * Analytics Routes
 * 
 * This module provides API endpoints for retrieving analytics data.
 * All routes are protected and require authentication.
 * Admin privileges are required to access these endpoints.
 */

const router = express.Router();

/**
 * @route   GET /api/analytics
 * @desc    Get comprehensive analytics data including sales metrics and trends
 * @access  Private/Admin
 * @returns {Object} Analytics data including sales metrics and daily trends
 * 
 * @middleware protectRoute - Ensures user is authenticated
 * @middleware adminRoute - Restricts access to admin users only
 * 
 * @response {Object} 200 - Success response with analytics data
 * @response {Object} 401 - Unauthorized (missing or invalid token)
 * @response {Object} 403 - Forbidden (user is not an admin)
 * @response {Object} 500 - Server error
 * 
 * @example
 * // Response example
 * {
 *   "analyticsData": {
 *     "totalSales": 15000,
 *     "totalOrders": 125,
 *     "totalProducts": 45,
 *     "totalUsers": 89
 *   },
 *   "dailySalesData": [
 *     { "date": "2023-10-01", "sales": 1200 },
 *     { "date": "2023-10-02", "sales": 1800 }
 *   ]
 * }
 */
router.get('/', protectRoute, adminRoute, async (req, res) => {
    try {
        // 1. Fetch general analytics data (totals, counts, etc.)
        const analyticsData = await getAnalyticsData();

        // 2. Calculate date range for daily sales data (last 7 days)
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

        // 3. Fetch daily sales data for the calculated date range
        const dailySalesData = await getDailySalesData(startDate, endDate);

        // 4. Return combined analytics data
        res.status(200).json({
            success: true,
            data: {
                analytics: analyticsData,
                trends: {
                    dailySales: dailySalesData
                }
            },
            meta: {
                dateRange: {
                    start: startDate.toISOString().split('T')[0],
                    end: endDate.toISOString().split('T')[0],
                    days: 7
                }
            }
        });
    } catch (error) {
        console.error('Analytics route error:', error);
        
        // 5. Handle specific error cases
        let statusCode = 500;
        let errorMessage = 'Failed to fetch analytics data';
        
        if (error.name === 'ValidationError') {
            statusCode = 400;
            errorMessage = error.message;
        }
        
        // 6. Return error response
        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   GET /api/admin/analytics/orders
 * @desc    Get detailed order analytics including status distribution and trends
 * @access  Private/Admin
 * @returns {Object} Order analytics data
 * 
 * @middleware protectRoute - Ensures user is authenticated
 * @middleware adminRoute - Restricts access to admin users only
 * 
 * @response {Object} 200 - Success response with order analytics
 * @response {Object} 401 - Unauthorized (missing or invalid token)
 * @response {Object} 403 - Forbidden (user is not an admin)
 * @response {Object} 500 - Server error
 * 
 * @example
 * // Response example
 * {
 *   "success": true,
 *   "data": {
 *     "totalOrders": 150,
 *     "statusDistribution": {
 *       "pending": 10,
 *       "processing": 25,
 *       "shipped": 30,
 *       "delivered": 80,
 *       "cancelled": 5
 *     },
 *     "revenueByStatus": {
 *       "pending": 500.00,
 *       "processing": 1250.00,
 *       "shipped": 3000.00,
 *       "delivered": 8000.00,
 *       "cancelled": 250.00
 *     },
 *     "averageOrderValue": 100.00,
 *     "ordersTrend": [
 *       { "date": "2023-10-01", "count": 5 },
 *       { "date": "2023-10-02", "count": 8 }
 *     ]
 *   }
 * }
 */
router.get('/orders', protectRoute, adminRoute, async (req, res) => {
    try {
        // Get date range from query params or default to last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30); // Default to last 30 days

        // Get total order count
        const totalOrders = await Order.countDocuments();

        // Get order status distribution
        const statusDistribution = await Order.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmount" }
                }
            },
            {
                $project: {
                    _id: 0,
                    status: "$_id",
                    count: 1,
                    totalAmount: 1
                }
            }
        ]);

        // Format status distribution
        const statusDistributionFormatted = statusDistribution.reduce((acc, curr) => {
            acc[curr.status] = {
                count: curr.count,
                revenue: curr.totalAmount
            };
            return acc;
        }, {});

        // Get orders trend (last 30 days by default)
        const ordersTrend = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Calculate average order value
        const revenueData = await Order.aggregate([
            {
                $match: {
                    status: { $in: ['completed', 'delivered'] },
                    paymentStatus: 'paid'
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" },
                    orderCount: { $sum: 1 }
                }
            }
        ]);

        const averageOrderValue = revenueData.length > 0 
            ? revenueData[0].totalRevenue / revenueData[0].orderCount 
            : 0;

        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                statusDistribution: statusDistributionFormatted,
                averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
                ordersTrend,
                dateRange: {
                    start: startDate.toISOString().split('T')[0],
                    end: endDate.toISOString().split('T')[0]
                }
            }
        });
    } catch (error) {
        console.error('Error in orders analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order analytics',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;