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
    const orderId = req.params.id; // Changed from req.params.orderId to req.params.id
    const { amount, reason, refundMethod } = req.body;

    console.log('Processing refund request:', {
      orderId,
      amount,
      reason,
      refundMethod,
      params: req.params,
      body: req.body
    });

    const order = await Order.findById(orderId);
    if (!order) {
      console.error('Order not found for refund:', { orderId });
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        details: {
          orderId,
          suggestion: 'Verify the order ID is correct and the order exists'
        }
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
  let newOrder;
  let order;
  
  try {
    const { items, returnId, status, notes } = req.body;
    const { orderId } = req.params;
    
    // Validate required parameters
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one item is required to split the order',
        details: { received: { items } }
      });
    }

    // If returnId is provided but invalid
    if (returnId && !mongoose.Types.ObjectId.isValid(returnId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid return ID format',
        details: { returnId }
      });
    }

    // Get the original order
    order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Process items for the new order
    const processedItems = [];
    let subtotal = 0;
    const movedProductIds = new Set();

    // Debug: Log all items in the order with their IDs
    console.log('Debug - Order items:');
    order.items.forEach((item, index) => {
      console.log(`Item ${index}:`, {
        _id: item._id,
        product: item.product,
        productId: item.product?._id?.toString() || item.product?.toString(),
        name: item.name,
        quantity: item.quantity
      });
    });

    for (const item of items) {
      console.log('Processing request item:', item);
      
      // Try to find the order item by either orderItemId or productId
      const orderItem = order.items.find(i => {
        const productId = i.product?._id?.toString() || i.product?.toString();
        const matchesProductId = item.productId && productId === item.productId.toString();
        const matchesOrderItemId = item.orderItemId && i._id.toString() === item.orderItemId.toString();
        
        console.log('Checking order item:', {
          itemId: i._id,
          productId: productId,
          matchesProductId,
          matchesOrderItemId,
          requestProductId: item.productId,
          requestOrderItemId: item.orderItemId
        });
        
        return matchesProductId || matchesOrderItemId;
      });

      if (!orderItem) {
        console.error('Failed to find matching order item for:', item);
        return res.status(400).json({
          success: false,
          error: `Could not find item with ID: ${item.orderItemId || item.productId} in the order`,
          details: { 
            item,
            availableItems: order.items.map(i => ({
              _id: i._id,
              product: i.product?._id?.toString() || i.product?.toString(),
              name: i.name
            }))
          }
        });
      }

      // Validate quantity
      const quantity = Math.min(item.quantity || 1, orderItem.quantity);
      
      processedItems.push({
        product: orderItem.product,
        name: orderItem.name,
        quantity: quantity,
        price: orderItem.price,
        sku: orderItem.sku,
        variant: orderItem.variant,
        // Copy other relevant fields
        ...(orderItem.weight && { weight: orderItem.weight }),
        ...(orderItem.image && { image: orderItem.image })
      });

      // Track which product IDs we're moving to the new order
      const productId = orderItem.product?._id?.toString() || orderItem.product?.toString();
      if (productId) {
        movedProductIds.add(productId);
      }

      subtotal += orderItem.price * quantity;
    }

    // Get the raw order object without mongoose magic
    const orderObj = order.toObject();
    
    // Create a new object with only the fields we want to keep
    const cleanOrder = {};
    const fieldsToKeep = [
      'user', 'items', 'totalAmount', 'status', 'paymentStatus',
      'shippingAddress', 'trackingNumber', 'notes', 'isGuest', 'guestEmail',
      'tax', 'shippingFee', 'discount', 'coupon', 'currency', 'metadata'
    ];
    
    // Only copy the fields we explicitly want to keep
    fieldsToKeep.forEach(field => {
      if (orderObj[field] !== undefined) {
        cleanOrder[field] = orderObj[field];
      }
    });
    
    // Create the new order with only the fields we want
    newOrder = new Order({
      ...cleanOrder,
      orderNumber: `SPLIT-${order.orderNumber}-${Date.now()}`,
      parentOrder: order._id,
      status: status || 'processing',
      items: processedItems,
      subtotal: subtotal,
      // Reset payment and shipping info
      paymentStatus: 'pending',
      paymentMethod: null,
      paymentDetails: null,
      shipping: {},
      // Reset financials
      shippingFee: 0,
      tax: 0,
      totalAmount: subtotal, // Set total amount to subtotal since we reset other fees
      // Clear any existing returns/refunds
      returns: [],
      refunds: [],
      refundedAmount: 0,
      // Explicitly set stripeSessionId to undefined to exclude it from the document
      stripeSessionId: undefined,
    });

    console.log('New order to be created:', JSON.stringify(newOrder, null, 2));
    
    // Save the new order
    await newOrder.save();
    console.log('New order created successfully:', newOrder._id);
    
    // Update the original order to remove the moved items
    order.items = order.items.filter(item => {
      const productId = item.product?._id?.toString() || item.product?.toString();
      return !movedProductIds.has(productId);
    });
    
    // Recalculate the original order's subtotal
    order.subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    order.totalAmount = order.subtotal + (order.shippingFee || 0) + (order.tax || 0) - (order.discount || 0);
    
    // Save the updated original order
    await order.save();
    console.log('Original order updated successfully');

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
    
    // If we have a new order but something went wrong, try to clean it up
    if (newOrder && newOrder._id) {
      try {
        await Order.findByIdAndDelete(newOrder._id);
        console.log('Cleaned up partially created order:', newOrder._id);
      } catch (cleanupError) {
        console.error('Error cleaning up after failed order split:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to split order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    // First, get the order to check if it exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Create a new note object
    const newNote = {
      text: note.trim(),
      addedBy: req.user._id,
      isCustomerVisible: Boolean(isCustomerVisible),
      createdAt: new Date()
    };

    // If there are no returns yet, create an empty one
    if (!order.returns || order.returns.length === 0) {
      order.returns = [{
        status: 'requested',
        notes: [newNote],
        createdAt: new Date(),
        updatedAt: new Date()
      }];
    } else {
      // Add note to the most recent return
      const lastReturn = order.returns[order.returns.length - 1];
      if (!lastReturn.notes) {
        lastReturn.notes = [];
      }
      lastReturn.notes.push(newNote);
      lastReturn.updatedAt = new Date();
    }

    // Save the order with the new note
    const updatedOrder = await order.save();
    
    // Get the most recently added note (should be the one we just added)
    const addedNote = updatedOrder.returns
      .flatMap(r => r.notes || [])
      .reverse()
      .find(n => n.text === newNote.text);

    if (!addedNote) {
      console.error('Failed to find the newly added note in the saved order');
      // Still return success but with a warning
      return res.status(201).json({
        success: true,
        warning: 'Note was added but could not be verified',
        data: {
          noteId: 'unknown',
          addedAt: new Date().toISOString(),
        },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        noteId: addedNote._id || 'unknown',
        addedAt: addedNote.createdAt || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error adding order note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add order note',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
    // Default to current year if no dates provided
    const currentYear = new Date().getFullYear();
    const defaultStartDate = new Date(`${currentYear}-01-01`);
    const defaultEndDate = new Date(`${currentYear}-12-31`);
    
    // Get query parameters with defaults
    const startDate = req.query.startDate ? new Date(req.query.startDate) : defaultStartDate;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : defaultEndDate;
    const groupBy = req.query.groupBy || 'day';
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Please use YYYY-MM-DD',
      });
    }

    // Set end of day for end date
    endDate.setHours(23, 59, 59, 999);

    // Grouping configuration
    const dateFormats = {
      day: { 
        format: '%Y-%m-%d',
        groupId: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        sortFormat: '%Y%m%d'
      },
      week: { 
        format: '%Y-W%U',
        groupId: { $dateToString: { format: '%Y-%U', date: '$createdAt' } },
        sortFormat: '%Y%U'
      },
      month: { 
        format: '%Y-%m',
        groupId: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        sortFormat: '%Y%m'
      },
      year: { 
        format: '%Y',
        groupId: { $dateToString: { format: '%Y', date: '$createdAt' } },
        sortFormat: '%Y'
      },
    };

    const dateConfig = dateFormats[groupBy] || dateFormats.day;

    // Aggregate pipeline
    const pipeline = [
      {
        $match: {
          status: { $in: ['completed', 'delivered'] },
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: { $ne: 'refunded' } // Exclude refunded orders
        }
      },
      {
        $group: {
          _id: dateConfig.groupId,
          date: { $first: { $dateToString: { format: dateConfig.format, date: '$createdAt' } } },
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' },
          productCount: { $sum: { $size: '$items' } },
          taxCollected: { $sum: '$tax' },
          shippingCollected: { $sum: '$shippingFee' },
          discountAmount: { $sum: '$discount' },
          orders: {
            $push: {
              orderId: '$_id',
              total: '$totalAmount',
              items: '$items',
              createdAt: '$createdAt'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          date: 1,
          totalSales: { $round: ['$totalSales', 2] },
          orderCount: 1,
          averageOrderValue: { $round: ['$averageOrderValue', 2] },
          productCount: 1,
          taxCollected: { $round: ['$taxCollected', 2] },
          shippingCollected: { $round: ['$shippingCollected', 2] },
          discountAmount: { $round: ['$discountAmount', 2] },
          netSales: {
            $round: [
              { $subtract: [
                '$totalSales',
                { $add: ['$taxCollected', '$shippingCollected'] }
              ] },
              2
            ]
          },
          orders: 1
        }
      },
      {
        $sort: { date: 1 }
      }
    ];

    // Execute aggregation
    const salesData = await Order.aggregate(pipeline);

    // Calculate totals
    const totals = salesData.reduce((acc, curr) => ({
      totalSales: (acc.totalSales || 0) + (curr.totalSales || 0),
      orderCount: (acc.orderCount || 0) + (curr.orderCount || 0),
      productCount: (acc.productCount || 0) + (curr.productCount || 0),
      taxCollected: (acc.taxCollected || 0) + (curr.taxCollected || 0),
      shippingCollected: (acc.shippingCollected || 0) + (curr.shippingCollected || 0),
      discountAmount: (acc.discountAmount || 0) + (curr.discountAmount || 0),
      netSales: (acc.netSales || 0) + (curr.netSales || 0)
    }), {});

    // Add average order value to totals
    totals.averageOrderValue = totals.orderCount > 0 
      ? parseFloat((totals.totalSales / totals.orderCount).toFixed(2))
      : 0;

    // Format response
    const response = {
      success: true,
      data: salesData,
      meta: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        groupBy,
        ...totals
      }
    };

    // Handle CSV format if requested
    if (req.query.format === 'csv') {
      // Convert to CSV
      if (salesData.length === 0) {
        return res.status(200).send('No data available for the selected period');
      }
      
      // Create CSV header
      const fields = Object.keys(salesData[0]).filter(field => field !== 'orders');
      let csv = fields.join(',') + '\n';
      
      // Add rows
      salesData.forEach(item => {
        const row = fields.map(field => {
          const value = item[field];
          // Handle nested objects and arrays
          if (typeof value === 'object') {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          return `"${value}"`;
        });
        csv += row.join(',') + '\n';
      });
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="sales-report-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.status(200).send(csv);
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
