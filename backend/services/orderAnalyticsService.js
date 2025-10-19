import Order from '../models/order.model.js';
import Product from '../models/product.model.js';

class OrderAnalyticsService {
  static async getSalesTrends(startDate, endDate, groupBy = 'day') {
    let dateFormat = '%Y-%m-%d';
    let dateGroup = { $dateToString: { format: dateFormat, date: "$createdAt" } };

    if (groupBy === 'month') {
      dateFormat = '%Y-%m';
      dateGroup = { $dateToString: { format: dateFormat, date: "$createdAt" } };
    } else if (groupBy === 'year') {
      dateFormat = '%Y';
      dateGroup = { $dateToString: { format: dateFormat, date: "$createdAt" } };
    }

    return Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $nin: ['cancelled', 'refunded'] }
        }
      },
      {
        $group: {
          _id: dateGroup,
          totalSales: { $sum: "$total" },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: "$total" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }

  static async getTopProducts(limit = 10, startDate, endDate) {
    const matchStage = {
      status: { $nin: ['cancelled', 'refunded'] }
    };

    if (startDate && endDate) {
      matchStage.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    return Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: limit }
    ]);
  }

  static async getRevenueByCategory(startDate, endDate) {
    const matchStage = {
      status: { $nin: ['cancelled', 'refunded'] }
    };

    if (startDate && endDate) {
      matchStage.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    return Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
          quantity: { $sum: "$items.quantity" }
        }
      },
      { $sort: { revenue: -1 } }
    ]);
  }

  static async getRevenueByDateRange(startDate, endDate) {
    const matchStage = {
      status: { $nin: ['cancelled', 'refunded'] }
    };

    if (startDate && endDate) {
      matchStage.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    return Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: "$total" },
          startDate: { $min: "$createdAt" },
          endDate: { $max: "$createdAt" }
        }
      }
    ]);
  }

  static async getCustomerOrderStats(customerId) {
    return Order.aggregate([
      {
        $match: { user: customerId }
      },
      {
        $group: {
          _id: "$user",
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$total" },
          averageOrderValue: { $avg: "$total" },
          firstOrderDate: { $min: "$createdAt" },
          lastOrderDate: { $max: "$createdAt" }
        }
      }
    ]);
  }
}

export default OrderAnalyticsService;
