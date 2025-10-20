import Order from '../../models/order.model.js';
import { v4 as uuidv4 } from 'uuid';
import { addToStatusHistory } from './order.utils.js';
import mongoose from 'mongoose';

/**
 * Bulk update order statuses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const bulkUpdateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderIds, status, notifyCustomer = false, statusNote = '' } = req.body;
    const userId = req.user.id;
    const timestamp = new Date();

    // Update all orders in a single operation
    const { modifiedCount } = await Order.updateMany(
      { _id: { $in: orderIds } },
      { 
        $set: { status },
        $push: {
          statusHistory: {
            status,
            changedBy: userId,
            date: timestamp,
            note: statusNote
          }
        }
      },
      { session }
    );

    // If no orders were updated, rollback
    if (modifiedCount === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        error: 'No orders found or no changes made'
      });
    }

    // TODO: Implement email notifications if notifyCustomer is true
    // This would be handled by a separate service/queue

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: `Successfully updated status for ${modifiedCount} order(s)`,
      data: {
        updatedCount: modifiedCount,
        status,
        timestamp
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Bulk update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update orders',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Process a refund for an order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const processRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount, reason, refundMethod } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Validate refund amount doesn't exceed order total
    const maxRefundAmount = order.totalAmount - (order.refundedAmount || 0);
    if (amount > maxRefundAmount) {
      return res.status(400).json({
        success: false,
        error: `Refund amount cannot exceed $${maxRefundAmount}`,
      });
    }

    // Create refund record
    const refund = {
      refundId: `REF-${uuidv4().substring(0, 8).toUpperCase()}`,
      amount,
      reason,
      method: refundMethod,
      processedBy: req.user._id,
      processedAt: new Date(),
    };

    // Update order with refund
    order.refunds = order.refunds || [];
    order.refunds.push(refund);
    order.refundedAmount = (order.refundedAmount || 0) + amount;
    
    // Update order status if fully refunded
    if (order.refundedAmount >= order.totalAmount) {
      order.status = 'refunded';
    }

    await order.save();

    res.status(200).json({
      success: true,
      data: {
        refundId: refund.refundId,
        amount: refund.amount,
        status: 'completed',
      },
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process refund',
    });
  }
};

/**
 * List all return requests (admin)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const listReturnRequests = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    // Start with orders that have returns
    const query = { 'returns.0': { $exists: true } };
    
    // Apply filters
    if (status) {
      query['returns.status'] = status;
    }
    
    if (startDate || endDate) {
      query['returns.requestedAt'] = {};
      if (startDate) {
        query['returns.requestedAt'].$gte = new Date(startDate);
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query['returns.requestedAt'].$lte = endOfDay;
      }
    }

    // Get orders with their returns
    const orders = await Order.find(query)
      .select('orderNumber status returns items customerEmail')
      .populate('items.product', 'name')
      .sort({ 'returns.requestedAt': -1 })
      .lean();

    // Process returns with more details
    const returns = [];
    
    orders.forEach(order => {
      order.returns.forEach(ret => {
        // Find the items in this return
        const returnItems = ret.items.map(item => {
          const orderItem = order.items.find(i => i._id.toString() === item.orderItemId);
          return {
            ...item,
            name: orderItem?.name || item.name,
            product: orderItem?.product || null
          };
        });
        
        returns.push({
          returnId: ret.returnId,
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: ret.status,
          reason: ret.reason,
          requestedAt: ret.requestedAt,
          processedAt: ret.processedAt,
          items: returnItems,
          customerEmail: order.customerEmail,
          orderStatus: order.status
        });
      });
    });

    res.status(200).json({
      success: true,
      count: returns.length,
      data: returns,
    });
  } catch (error) {
    console.error('Error fetching return requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch return requests',
    });
  }
};

/**
 * Update return status (admin)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateReturnStatus = async (req, res) => {
  try {
    // Log the complete request for debugging
    console.log('Request received - updateReturnStatus:', {
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      body: req.body,
      headers: {
        'content-type': req.get('content-type'),
        'authorization': req.get('authorization') ? '***' : 'not provided'
      }
    });

    // Get returnId from params and validate (using 'id' as parameter name to match route)
    const returnId = req.params.id;
    const { status, notes } = req.body;

    // Validate returnId
    if (!returnId) {
      console.error('Missing returnId in request:', { 
        params: req.params,
        body: req.body 
      });
      return res.status(400).json({
        success: false,
        error: 'Return ID is required',
        details: {
          receivedParams: Object.keys(req.params),
          receivedQuery: Object.keys(req.query),
          receivedBody: Object.keys(req.body)
        }
      });
    }

    // Validate status
    const validStatuses = ['approved', 'rejected', 'processing', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Find the order containing this return
    const order = await Order.findOne({
      'returns.returnId': returnId
    });

    if (!order) {
      console.error('Order with return not found for returnId:', returnId);
      return res.status(404).json({
        success: false,
        error: 'Return request not found',
        details: {
          returnId,
          suggestion: 'Verify the return ID is correct and the return exists'
        }
      });
    }

    // Debug: Log the request and order details
    console.log('Debug - Request details:', {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      params: req.params,
      query: req.query,
      headers: {
        'content-type': req.get('content-type'),
        'authorization': req.get('authorization') ? '***' : 'not provided'
      }
    });
    
    // Debug: Log the order and return details
    console.log('Debug - Order returns:', {
      orderId: order._id,
      orderReturnsCount: order.returns ? order.returns.length : 0,
      searchingForReturnId: returnId,
      allReturnIds: order.returns ? order.returns.map(r => ({
        id: r.returnId,
        type: typeof r.returnId,
        status: r.status
      })) : 'No returns array',
      orderStatus: order.status,
      orderTotal: order.totalAmount,
      orderItems: order.items ? order.items.length : 0
    });

    // Find the specific return in the order
    const returnRequest = order.returns ? order.returns.find(r => {
      const match = r.returnId === returnId || 
                   (r.returnId && r.returnId.toString() === returnId) ||
                   (r._id && r._id.toString() === returnId);
      if (match) {
        console.log('Found matching return:', {
          returnId: r.returnId,
          _id: r._id,
          status: r.status,
          type: typeof r.returnId
        });
      }
      return match;
    }) : null;

    if (!returnRequest) {
      console.error('Return request not found in order:', {
        orderId: order._id,
        returnId,
        returnIdType: typeof returnId,
        availableReturns: order.returns ? order.returns.map(r => ({
          id: r.returnId,
          type: typeof r.returnId,
          _id: r._id,
          status: r.status
        })) : 'No returns array',
        orderStatus: order.status,
        orderTotal: order.totalAmount,
        orderItems: order.items ? order.items.length : 0
      });
      
      return res.status(404).json({
        success: false,
        error: 'Return request not found in order',
        details: {
          orderId: order._id,
          returnId,
          returnIdType: typeof returnId,
          availableReturns: order.returns ? order.returns.length : 0,
          orderStatus: order.status,
          orderItems: order.items ? order.items.length : 0,
          suggestion: 'Check if the return ID is correct and the order has any return requests'
        }
      });
    }

    // Update status
    const previousStatus = returnRequest.status;
    returnRequest.status = status;
    returnRequest.updatedAt = new Date();
    
    // Update all item statuses to match the parent return status if they are in a request state
    if (returnRequest.items && returnRequest.items.length > 0) {
      returnRequest.items.forEach(item => {
        // Only update status if it's in a request state
        if (['requested', 'pending'].includes(item.status)) {
          // Map the parent status to a valid item status
          const statusMap = {
            'approved': 'approved',
            'rejected': 'rejected',
            'processing': 'pending',
            'completed': 'refunded',
            'requested': 'pending'  // Default mapping for requested
          };
          
          item.status = statusMap[status] || 'pending';
          item.processedAt = new Date();
        }
      });
    }
    
    // Add note if provided
    if (notes) {
      returnRequest.notes = returnRequest.notes || [];
      returnRequest.notes.push({
        text: notes,
        addedBy: req.user._id,
        addedAt: new Date(),
      });
    }

    // Save the order with updated return
    await order.save();

    console.log('Successfully updated return status:', {
      returnId,
      previousStatus,
      newStatus: status,
      orderId: order._id
    });

    res.status(200).json({
      success: true,
      data: {
        returnId: returnRequest.returnId,
        status: returnRequest.status,
        updatedAt: returnRequest.updatedAt,
        orderId: order._id,
        orderNumber: order.orderNumber
      },
    });
  } catch (error) {
    console.error('Error updating return status:', {
      error: error.message,
      stack: error.stack,
      params: req.params,
      body: req.body
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update return status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Split order into multiple shipments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const splitOrder = async (req, res) => {
  try {
    const { orderId, items } = req.body;
    const { returnId, status, notes } = req.params;
    
    // Validate required parameters
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required',
        details: { received: { orderId } }
      });
    }
    
    if (!returnId) {
      return res.status(400).json({
        success: false,
        error: 'Return ID is required',
        details: { 
          received: { 
            orderId,
            returnId: returnId === undefined ? 'undefined' : returnId,
            returnIdType: typeof returnId
          }
        }
      });
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one item must be specified for the split',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Create new order for the split items
    const newOrder = new Order({
      ...order.toObject(),
      _id: undefined, // Let MongoDB generate a new ID
      orderNumber: `SPLIT-${order.orderNumber}-${Date.now()}`,
      parentOrder: order._id,
      status: 'processing',
      items: items.map(item => ({
        ...item,
        price: order.items.find(i => i._id.toString() === item.orderItemId.toString())?.price || 0,
      })),
      subtotal: items.reduce((sum, item) => {
        const orderItem = order.items.find(i => i._id.toString() === item.orderItemId.toString());
        return sum + (orderItem?.price || 0) * item.quantity;
      }, 0),
      // Reset these as they'll be recalculated
      shippingFee: 0,
      tax: 0,
      totalAmount: 0,
      // Clear payment and shipping info
      paymentStatus: 'pending',
      paymentMethod: null,
      paymentDetails: null,
      shipping: {},
      // Clear any existing returns/refunds
      returns: [],
      refunds: [],
      refundedAmount: 0,
    });

    // Recalculate order totals
    // Note: You might want to implement your own calculateOrderTotals function
    // that handles taxes, shipping, etc.
    await newOrder.save();

    // Update original order to remove split items
    order.items = order.items.filter(
      item => !items.some(splitItem => splitItem.orderItemId === item._id.toString())
    );
    
    // Recalculate original order totals
    order.subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // Recalculate other totals (tax, shipping, etc.)
    // ...
    
    await order.save();

    res.status(201).json({
      success: true,
      data: {
        originalOrderId: order._id,
        newOrderId: newOrder._id,
        newOrderNumber: newOrder.orderNumber,
      },
    });
  } catch (error) {
    console.error('Error splitting order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to split order',
    });
  }
};

/**
 * Add internal note to order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const addOrderNote = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { note, isCustomerVisible = false } = req.body;

    if (!note || typeof note !== 'string' || note.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Note content is required',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Initialize notes array if it doesn't exist
    order.notes = order.notes || [];
    
    // Add new note
    order.notes.push({
      note: note.trim(),
      addedBy: req.user._id,
      isCustomerVisible: Boolean(isCustomerVisible),
      addedAt: new Date(),
    });

    await order.save();

    res.status(201).json({
      success: true,
      data: {
        noteId: order.notes[order.notes.length - 1]._id,
        addedAt: order.notes[order.notes.length - 1].addedAt,
      },
    });
  } catch (error) {
    console.error('Error adding order note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add order note',
    });
  }
};

/**
 * Generate sales report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const generateSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day', format = 'json' } = req.query;
    
    // Build date range query
    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);

    // Grouping logic
    let groupStage = {};
    const dateFormat = {
      day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      week: { $dateToString: { format: '%Y-%U', date: '$createdAt' } },
      month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
      year: { $dateToString: { format: '%Y', date: '$createdAt' } },
    }[groupBy] || '$createdAt';

    // Aggregate sales data
    const salesData = await Order.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'delivered'] },
          ...(Object.keys(dateQuery).length > 0 && { createdAt: dateQuery }),
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          date: { $first: dateFormat },
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format response based on requested format
    if (format.toLowerCase() === 'csv') {
      // Convert to CSV
      const header = Object.keys(salesData[0] || {}).join(',');
      const rows = salesData.map(item => 
        Object.values(item).map(field => 
          typeof field === 'string' ? `"${field.replace(/"/g, '""')}"` : field
        ).join(',')
      );
      const csv = [header, ...rows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="sales-report-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csv);
    }

    // Default to JSON
    res.status(200).json({
      success: true,
      data: salesData,
      meta: {
        startDate: startDate || 'Beginning of records',
        endDate: endDate || 'Now',
        groupBy,
        totalSales: salesData.reduce((sum, item) => sum + item.totalSales, 0),
        totalOrders: salesData.reduce((sum, item) => sum + item.orderCount, 0),
      },
    });
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate sales report',
    });
  }
};

export default {
  processRefund,
  listReturnRequests,
  updateReturnStatus,
  splitOrder,
  addOrderNote,
  generateSalesReport,
};
