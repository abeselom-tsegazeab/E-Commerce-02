import Order from '../../models/order.model.js';
import { generateTrackingNumber } from './order.utils.js';
import { v4 as uuidv4 } from 'uuid';
import { format, addDays, isAfter, differenceInDays, formatDistanceToNow } from 'date-fns';
import { generateInvoicePDF } from '../../utils/pdfGenerator.js';

/**
 * Generate and send order invoice
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Find the order with necessary population
    const order = await Order.findById(orderId)
      .populate('user', 'email firstName lastName')
      .populate('items.product', 'name price')
      .populate('products.product', 'name price')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        details: {
          orderId,
          suggestion: 'Please verify the order ID and try again.'
        }
      });
    }

    // Use items if available, otherwise fall back to products
    const orderItems = Array.isArray(order.items) && order.items.length > 0 
      ? order.items 
      : Array.isArray(order.products) 
        ? order.products.map(p => ({ ...p, product: p.product || p })) 
        : [];

    if (orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No items found in this order',
        details: {
          orderId: order._id,
          suggestion: 'Please contact support if you believe this is an error.'
        }
      });
    }

    // Generate PDF invoice
    const invoiceData = {
      orderId: order.orderNumber || order._id.toString(),
      date: format(new Date(order.createdAt || new Date()), 'MMMM dd, yyyy'),
      customer: {
        name: order.shippingAddress ? 
          `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim() || 'Guest Customer' : 
          'Guest Customer',
        email: order.user?.email || order.guestEmail || 'no-email@example.com',
        address: order.shippingAddress || {
          street: 'N/A',
          city: 'N/A',
          state: 'N/A',
          postalCode: 'N/A',
          country: 'N/A'
        },
      },
      items: orderItems.map(item => {
        const product = item.product || {};
        const productName = product.name || 'Unknown Product';
        const productPrice = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 1;
        
        return {
          name: productName,
          variant: item.variant || product.variant || 'N/A',
          quantity: quantity,
          price: productPrice,
          total: productPrice * quantity,
        };
      }),
      subtotal: Number(order.subtotal) || 0,
      shipping: Number(order.shippingFee) || 0,
      tax: Number(order.tax) || 0,
      total: Number(order.totalAmount) || 0,
    };

    const pdfBuffer = await generateInvoicePDF(invoiceData);

    // Send response with PDF
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-${invoiceData.orderId}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating invoice:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate invoice',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};

/**
 * Request order return
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const requestReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, items } = req.body;
    const userId = req.user?._id;
    const userEmail = req.user?.email;

    // Validate request body
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: {
          issue: 'No items specified for return',
          suggestion: 'Please specify at least one item to return'
        }
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        details: { orderId }
      });
    }

    // Check order ownership
    const orderUserId = order.user?._id?.toString() || order.user?.toString();
    const currentUserId = req.user?._id?.toString() || req.user?.id?.toString();
    const isGuestOrder = !!order.guestEmail;
    
    const isOwner = (
      // For registered users
      (orderUserId && currentUserId && orderUserId === currentUserId) ||
      // For guest orders
      (isGuestOrder && userEmail && order.guestEmail?.toLowerCase() === userEmail.toLowerCase())
    );

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        details: {
          issue: 'You do not have permission to return this order',
          suggestion: isGuestOrder
            ? 'Please ensure you\'re logged in with the email used to place this order.'
            : 'This order belongs to a different account.'
        }
      });
    }

    // Check if order is eligible for return
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        error: 'Order not eligible for return',
        details: {
          currentStatus: order.status,
          requiredStatus: 'delivered',
          suggestion: order.status === 'shipped' 
            ? 'Please wait for your order to be delivered before requesting a return.'
            : 'This order cannot be returned in its current status.'
        }
      });
    }

    // Check return window (30 days from delivery/creation)
    const returnWindowDays = 30;
    const deliveredDate = order.deliveredAt || order.createdAt;
    const returnDeadline = addDays(new Date(deliveredDate), returnWindowDays);
    const today = new Date();
    const daysSinceDelivery = differenceInDays(today, new Date(deliveredDate));

    if (isAfter(today, returnDeadline)) {
      return res.status(400).json({
        success: false,
        error: 'Return window expired',
        details: {
          deliveredDate,
          returnDeadline,
          daysSinceDelivery,
          maxReturnWindowDays: returnWindowDays,
          suggestion: 'The return window for this order has closed. Please contact customer support for assistance.'
        }
      });
    }

    // Validate return items
    const invalidItems = [];
    const validItems = [];

    for (const [index, item] of items.entries()) {
      const orderItem = order.items.find(i => i._id.toString() === item.orderItemId);
      
      if (!orderItem) {
        invalidItems.push({
          itemIndex: index,
          orderItemId: item.orderItemId,
          error: 'Item not found in order',
          suggestion: 'Verify the order item ID is correct.'
        });
        continue;
      }

      if (item.quantity > orderItem.quantity) {
        invalidItems.push({
          itemIndex: index,
          orderItemId: item.orderItemId,
          error: 'Invalid quantity',
          details: {
            requested: item.quantity,
            available: orderItem.quantity,
            productName: orderItem.name
          },
          suggestion: `You can return up to ${orderItem.quantity} of this item.`
        });
        continue;
      }

      // Check if item is already returned
      const existingReturn = order.returns?.find(r => 
        r.items.some(i => i.orderItemId.toString() === item.orderItemId && i.status !== 'rejected')
      );

      if (existingReturn) {
        invalidItems.push({
          itemIndex: index,
          orderItemId: item.orderItemId,
          error: 'Item already has a return request',
          details: {
            returnId: existingReturn.returnId,
            status: existingReturn.status
          },
          suggestion: 'Check your return status or contact support for assistance.'
        });
        continue;
      }

      validItems.push({
        ...item,
        name: orderItem.name,
        price: orderItem.price
      });
    }

    if (invalidItems.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Some items cannot be returned',
        details: {
          invalidItems,
          validItems,
          suggestion: 'Please correct the invalid items and try again.'
        }
      });
    }

    // Add return request to order
    order.returns = order.returns || [];
    
    // Format return items for the returns array
    const returnItems = validItems.map(item => ({
      orderItemId: item.orderItemId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      reason: item.reason,
      status: 'requested',
      processedAt: null
    }));

    // Create the return request
    const returnRequest = {
      returnId: `RTN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'requested',
      reason,
      items: returnItems,
      requestedAt: new Date(),
      processedBy: null,
      notes: [],
      returnDeadline,
      remainingReturnWindowDays: Math.ceil(differenceInDays(returnDeadline, today))
    };

    // Add to returns array
    order.returns.push(returnRequest);

    // Mark the specific items as return requested
    for (const item of validItems) {
      const orderItem = order.items.find(i => i._id.toString() === item.orderItemId);
      if (orderItem) {
        orderItem.returnStatus = 'requested';
        orderItem.returnRequestedAt = new Date();
        orderItem.returnReason = item.reason;
      }
    }

    // Only update the main order status to 'refunded' if all items are being returned
    const allItemsBeingReturned = order.items.every(item => 
      item.returnStatus === 'requested' || item.returnStatus === 'returned'
    );
    
    if (allItemsBeingReturned) {
      order.status = 'refunded';
    }

    await order.save();

    // TODO: Send return request confirmation email

    res.status(201).json({
      success: true,
      data: {
        returnId: returnRequest.returnId,
        status: returnRequest.status,
        items: returnRequest.items.map(item => ({
          orderItemId: item.orderItemId,
          name: item.name,
          quantity: item.quantity,
          status: item.status
        })),
        requestedAt: returnRequest.requestedAt,
        returnDeadline: returnRequest.returnDeadline,
        remainingReturnWindowDays: returnRequest.remainingReturnWindowDays,
        nextSteps: [
          'We\'ve received your return request.',
          'Our team will review your request and contact you within 1-2 business days.',
          'Please keep the items in their original packaging.'
        ]
      }
    });
  } catch (error) {
    console.error('Error processing return request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process return request',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};

/**
 * Track order status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .select('orderNumber status shipping trackingHistory customerEmail items')
      .populate('items.product', 'name image');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        details: {
          orderId,
          suggestion: 'Please verify the order ID and try again.'
        }
      });
    }

    // Format tracking history with human-readable timestamps
    const formattedHistory = (order.trackingHistory || []).map(event => ({
      ...event,
      timestamp: new Date(event.timestamp).toISOString(),
      timeAgo: formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })
    }));

    // Format order items with product details
    const formattedItems = order.items.map(item => ({
      name: item.product?.name || item.name,
      image: item.product?.image || item.image,
      quantity: item.quantity,
      price: item.price,
      status: item.status
    }));

    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        items: formattedItems,
        shipping: {
          trackingNumber: order.shipping?.trackingNumber,
          carrier: order.shipping?.carrier || 'Standard Shipping',
          estimatedDelivery: order.shipping?.estimatedDelivery,
          address: order.shipping?.address
        },
        trackingHistory: formattedHistory,
        customerEmail: order.customerEmail ? 
          order.customerEmail.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + b.replace(/\./g, '*') + c) : 
          null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        supportContact: 'support@example.com'
      }
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track order',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};

/**
 * Export orders to CSV/Excel/JSON
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const exportOrders = async (req, res) => {
  try {
    const { format = 'json', startDate, endDate, status } = req.query;
    
    // Build query
    const query = {};
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Status filter
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }

    // Get orders with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .select('orderNumber createdAt status totalAmount paymentStatus customerEmail items')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query)
    ]);

    // Format data based on requested format
    let data;
    let contentType;
    let fileName = `orders-${new Date().toISOString().split('T')[0]}`;

    switch (format.toLowerCase()) {
      case 'csv':
        // Convert to CSV
        const headers = ['Order Number', 'Date', 'Status', 'Total', 'Payment Status', 'Item Count'];
        const rows = orders.map(order => [
          `"${order.orderNumber}"`,
          `"${new Date(order.createdAt).toISOString()}"`,
          `"${order.status}"`,
          order.totalAmount,
          `"${order.paymentStatus || 'N/A'}"`,
          order.items?.length || 0
        ]);
        
        data = [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n');
        
        contentType = 'text/csv';
        fileName += '.csv';
        break;
      
      case 'json':
      default:
        data = JSON.stringify({
          success: true,
          count: orders.length,
          total,
          page,
          pages: Math.ceil(total / limit),
          data: orders
        }, null, 2);
        contentType = 'application/json';
        fileName += '.json';
    }

    // Set headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Send the file
    return res.send(data);
  } catch (error) {
    console.error('Error exporting orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export orders',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};

export default {
  generateInvoice,
  requestReturn,
  trackOrder,
  exportOrders,
};
