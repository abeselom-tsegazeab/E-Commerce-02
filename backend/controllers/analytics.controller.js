/**
 * Analytics Controller
 * 
 * This module provides comprehensive analytics functionality for the e-commerce platform,
 * including user statistics, product metrics, sales analysis, and business intelligence.
 * It leverages MongoDB aggregation pipelines for efficient data processing.
 * 
 * @module controllers/analytics
 * @requires ../models/order.model
 * @requires ../models/product.model
 * @requires ../models/user.model
 */

import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

/**
 * @typedef {Object} AnalyticsData
 * @property {number} users - Total number of registered users
 * @property {number} products - Total number of active products in inventory
 * @property {number} totalSales - Total count of completed orders
 * @property {number} totalRevenue - Sum of all order amounts (in base currency)
 */

/**
 * Retrieves a comprehensive overview of platform metrics and business performance.
 * This function aggregates data from multiple collections to provide key performance
 * indicators (KPIs) for the admin dashboard.
 * 
 * @async
 * @function getAnalyticsData
 * @returns {Promise<AnalyticsData>} Object containing aggregated analytics data
 * @throws {Error} If database operations fail
 * @example
 * // Example return value
 * {
 *   users: 150,
 *   products: 45,
 *   totalSales: 320,
 *   totalRevenue: 24500.75
 * }
 */
export const getAnalyticsData = async () => {
    try {
        // Get total user count (active users only)
        const totalUsers = await User.countDocuments({ isActive: { $ne: false } });
        
        // Get total active product count (only non-deleted products)
        const totalProducts = await Product.countDocuments({ 
            isDeleted: { $ne: true },
            status: 'active'
        });

        // Aggregate order data to calculate sales metrics for completed orders only
        const salesData = await Order.aggregate([
            {
                $match: {
                    status: { $in: ['completed', 'delivered'] },
                    paymentStatus: 'paid'
                }
            },
            {
                $group: {
                    _id: null, // Groups all documents together
                    totalSales: { $sum: 1 }, // Counts total completed orders
                    totalRevenue: { 
                        $sum: {
                            $cond: [
                                { $eq: ["$currency", "USD"] },
                                "$totalAmount",
                                { $divide: ["$totalAmount", 1] } // Add currency conversion if needed
                            ]
                        }
                    },
                },
            },
        ]);

        // Handle case with no orders
        const { totalSales = 0, totalRevenue = 0 } = salesData[0] || {};

        return {
            success: true,
            data: {
                users: totalUsers,
                products: totalProducts,
                totalSales,
                totalRevenue: parseFloat(totalRevenue.toFixed(2)), // Ensure 2 decimal places
                lastUpdated: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error('Error in getAnalyticsData:', error);
        throw new Error('Failed to fetch analytics data');
    }
};

/**
 * @typedef {Object} DailySalesData
 * @property {string} date - Date string in YYYY-MM-DD format
 * @property {number} sales - Number of sales for the date
 * @property {number} revenue - Total revenue for the date (in base currency)
 */

/**
 * Retrieves daily sales data within a specified date range.
 * This function provides a complete time series of sales data, including dates with no sales.
 * 
 * @async
 * @function getDailySalesData
 * @param {Date|string} startDate - The start date of the period (inclusive)
 * @param {Date|string} endDate - The end date of the period (inclusive)
 * @returns {Promise<{success: boolean, data: DailySalesData[]}>} Array of daily sales data
 * @throws {Error} If date range is invalid or database operation fails
 * @example
 * // Example usage
 * const start = new Date('2023-01-01');
 * const end = new Date('2023-01-31');
 * const salesData = await getDailySalesData(start, end);
 * 
 * // Example return value
 * {
 *   success: true,
 *   data: [
 *     { date: '2023-01-01', sales: 5, revenue: 1250.50 },
 *     { date: '2023-01-02', sales: 0, revenue: 0 },
 *     // ... more dates
 *   ]
 * }
 */
export const getDailySalesData = async (startDate, endDate) => {
    // Validate input dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date range provided');
    }
    
    if (start > end) {
        throw new Error('Start date must be before or equal to end date');
    }

    try {
        // Get sales data for the specified date range
        const dailySalesData = await Order.aggregate([
            {
                $match: {
                    status: { $in: ['completed', 'delivered'] },
                    paymentStatus: 'paid',
                    createdAt: {
                        $gte: start,
                        $lte: end,
                    },
                },
            },
            {
                $group: {
                    _id: { 
                        $dateToString: { 
                            format: "%Y-%m-%d", 
                            date: "$createdAt",
                            timezone: "UTC" // Ensure consistent timezone handling
                        } 
                    },
                    sales: { $sum: 1 },
                    revenue: { 
                        $sum: {
                            $cond: [
                                { $eq: ["$currency", "USD"] },
                                "$totalAmount",
                                { $divide: ["$totalAmount", 1] } // Add currency conversion if needed
                            ]
                        }
                    },
                },
            },
            { $sort: { _id: 1 } }, // Sort by date ascending
        ]);

        // Generate complete date range array
        const dateArray = getDatesInRange(start, end);

        // Map the complete date range with sales data (including zero-sale days)
        const result = dateArray.map((date) => {
            const foundData = dailySalesData.find((item) => item._id === date);
            
            return {
                date,
                sales: foundData?.sales || 0,
                revenue: foundData ? parseFloat(foundData.revenue.toFixed(2)) : 0,
            };
        });

        return {
            success: true,
            data: result,
            meta: {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                totalDays: result.length,
                totalSales: result.reduce((sum, day) => sum + day.sales, 0),
                totalRevenue: parseFloat(result.reduce((sum, day) => sum + day.revenue, 0).toFixed(2)),
            }
        };
    } catch (error) {
        console.error('Error in getDailySalesData:', error);
        throw new Error('Failed to fetch daily sales data');
    }
};

/**
 * Generates an array of dates in YYYY-MM-DD format for a given date range.
 * This utility function ensures consistent date handling and includes both start and end dates.
 * 
 * @private
 * @function getDatesInRange
 * @param {Date|string} startDate - The start date of the range (inclusive)
 * @param {Date|string} endDate - The end date of the range (inclusive)
 * @returns {string[]} Array of date strings in YYYY-MM-DD format
 * @throws {Error} If startDate or endDate are invalid
 * @example
 * const dates = getDatesInRange('2023-01-01', '2023-01-03');
 * // Returns: ['2023-01-01', '2023-01-02', '2023-01-03']
 */
function getDatesInRange(startDate, endDate) {
    // Create Date objects to ensure proper date handling
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Validate input dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date range provided');
    }
    
    if (start > end) {
        throw new Error('Start date must be before or equal to end date');
    }

    const dates = [];
    const currentDate = new Date(start);
    
    // Clone the date to avoid modifying the original
    const current = new Date(currentDate);
    
    // Generate all dates in the range (inclusive)
    while (current <= end) {
        // Format as YYYY-MM-DD in UTC to avoid timezone issues
        const dateStr = current.toISOString().split('T')[0];
        dates.push(dateStr);
        
        // Move to next day
        current.setDate(current.getDate() + 1);
    }
    
    return dates;
}
