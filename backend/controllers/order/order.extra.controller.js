import Order from '../../models/order.model.js';
import { generateTrackingNumber } from './order.utils.js';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

/**
 * Generate and send order invoice
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate('user', 'email firstName lastName')
      .populate('items.product', 'name price')
      .populate('items.variant', 'name price')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Generate PDF invoice
    const invoiceData = {
      orderId: order.orderNumber,
      date: format(new Date(order.createdAt), 'MMMM dd, yyyy'),
      customer: {
        name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        email: order.user?.email || order.guestEmail,
        address: order.shippingAddress,
      },
      items: order.items.map(item => ({
        name: item.product.name,
        variant: item.variant?.name || 'N/A',
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
      subtotal: order.subtotal,
      shipping: order.shippingFee,
      tax: order.tax,
      total: order.totalAmount,
    };

    const pdfBuffer = await generatePDF('invoice', invoiceData);

    // Send response with PDF
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-${order.orderNumber}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate invoice',
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
    const userId = req.user._id;

    const order = await Order.findOne({
      _id: orderId,
      $or: [
        { user: userId },
        { guestEmail: req.user.email },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found or not eligible for return',
      });
    }

    // Validate return eligibility (e.g., within return window)
    const returnWindowDays = 30; // Example: 30-day return policy
    const returnDeadline = new Date(order.deliveredAt || order.createdAt);
    returnDeadline.setDate(returnDeadline.getDate() + returnWindowDays);

    if (new Date() > returnDeadline) {
      return res.status(400).json({
        success: false,
        error: 'Return window has expired',
      });
    }

    // Create return request
    const returnRequest = {
      returnId: `RTN-${uuidv4().substring(0, 8).toUpperCase()}`,
      status: 'requested',
      reason,
      items: items.map(item => ({
        orderItemId: item.orderItemId,
        quantity: item.quantity,
        reason: item.reason,
        status: 'pending',
      })),
      requestedAt: new Date(),
    };

    order.returns = order.returns || [];
    order.returns.push(returnRequest);
    await order.save();

    res.status(201).json({
      success: true,
      data: {
        returnId: returnRequest.returnId,
        status: returnRequest.status,
      },
    });
  } catch (error) {
    console.error('Error processing return request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process return request',
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
    const { trackingNumber } = req.params;

    const order = await Order.findOne({
      'shipping.trackingNumber': trackingNumber,
    }).select('orderNumber status shipping.items trackingHistory');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found with the provided tracking number',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.shipping.trackingNumber,
        carrier: order.shipping.carrier,
        estimatedDelivery: order.shipping.estimatedDelivery,
        trackingHistory: order.trackingHistory || [],
      },
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track order',
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
    
    const query = {};
    
    // Apply date filters
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Apply status filter
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .select('orderNumber createdAt status totalAmount paymentStatus')
      .sort({ createdAt: -1 })
      .lean();

    // Format data based on requested format
    let data;
    let contentType;
    let fileName = `orders-${new Date().toISOString().split('T')[0]}`;

    switch (format.toLowerCase()) {
      case 'csv':
        // Convert to CSV
        const header = Object.keys(orders[0] || {}).join(',');
        const rows = orders.map(order => 
          Object.values(order).map(field => 
            typeof field === 'string' ? `\"${field.replace(/\"/g, '\"\"')}\"` : field
          ).join(',')
        );
        data = [header, ...rows].join('\n');
        contentType = 'text/csv';
        fileName += '.csv';
        break;
      
      case 'excel':
        // For Excel, we'd typically use a library like exceljs
        // This is a simplified example
        const excelData = orders.map(order => ({
          'Order Number': order.orderNumber,
          'Date': new Date(order.createdAt).toLocaleDateString(),
          'Status': order.status,
          'Total': order.totalAmount,
          'Payment Status': order.paymentStatus,
        }));
        
        // In a real implementation, you would use exceljs to create a proper Excel file
        // For now, we'll return as JSON with instructions
        return res.status(200).json({
          success: true,
          message: 'Excel export would be implemented with exceljs',
          data: excelData,
        });
      
      case 'json':
      default:
        data = JSON.stringify(orders, null, 2);
        contentType = 'application/json';
        fileName += '.json';
    }

    // Set headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=\"${fileName}\"`);
    
    // Send the file
    res.send(data);
  } catch (error) {
    console.error('Error exporting orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export orders',
    });
  }
};

export default {
  generateInvoice,
  requestReturn,
  trackOrder,
  exportOrders,
};