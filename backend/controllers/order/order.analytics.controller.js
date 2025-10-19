import OrderAnalyticsService from '../../services/orderAnalyticsService.js';

export const getOrderAnalytics = async (req, res) => {
  try {
    const { period = '30d', groupBy = 'day' } = req.query;
    let startDate, endDate = new Date();

    // Set date range based on period
    switch(period) {
      case '7d':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '90d':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '1y':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    const analytics = await OrderAnalyticsService.getSalesTrends(startDate, endDate, groupBy);
    const topProducts = await OrderAnalyticsService.getTopProducts(10, startDate, endDate);
    const revenueByCategory = await OrderAnalyticsService.getRevenueByCategory(startDate, endDate);

    res.json({
      success: true,
      data: {
        salesTrends: analytics,
        topProducts,
        revenueByCategory,
        period: {
          start: startDate,
          end: endDate,
          groupBy
        }
      }
    });
  } catch (error) {
    console.error('Error fetching order analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order analytics',
      error: error.message
    });
  }
};

export const getRevenueReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const [revenueData] = await OrderAnalyticsService.getRevenueByDateRange(
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );
    
    res.json({
      success: true,
      data: revenueData || {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0
      }
    });
  } catch (error) {
    console.error('Error generating revenue report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating revenue report',
      error: error.message
    });
  }
};

export const getTopProductsReport = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    const topProducts = await OrderAnalyticsService.getTopProducts(
      parseInt(limit),
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );
    
    res.json({
      success: true,
      data: topProducts
    });
  } catch (error) {
    console.error('Error generating top products report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating top products report',
      error: error.message
    });
  }
};
