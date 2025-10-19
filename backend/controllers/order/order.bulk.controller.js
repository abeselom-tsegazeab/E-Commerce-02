import Order from '../../models/order.model.js';
import { Parser } from 'json2csv';
import OrderStatusService from '../../services/orderStatusService.js';

export const bulkUpdateOrderStatus = async (req, res) => {
  const session = await Order.startSession();
  session.startTransaction();

  try {
    const { orderIds, status, notifyCustomers = false, note = '' } = req.body;
    const userId = req.user?.id;

    if (!orderIds || !orderIds.length || !status) {
      return res.status(400).json({
        success: false,
        message: 'Order IDs and status are required'
      });
    }

    // Update each order with status and history
    const updatePromises = orderIds.map(async (orderId) => {
      try {
        await OrderStatusService.updateStatus(orderId, status, userId);
        
        // Add note to order if provided
        if (note) {
          await Order.findByIdAndUpdate(orderId, {
            $push: {
              notes: {
                note,
                isInternal: true,
                createdBy: userId
              }
            }
          }, { session });
        }
        
        return { orderId, success: true };
      } catch (error) {
        console.error(`Error updating order ${orderId}:`, error);
        return { orderId, success: false, error: error.message };
      }
    });

    const results = await Promise.all(updatePromises);
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: `Updated ${successCount} orders successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
      results
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error in bulk update:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating orders',
      error: error.message
    });
  }
};

export const exportOrders = async (req, res) => {
  try {
    const { startDate, endDate, status, format = 'csv' } = req.query;
    
    const query = {};
    
    // Add date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Add status filter
    if (status) {
      query.status = status;
    }

    // Get orders with user and product details
    const orders = await Order.find(query)
      .populate('user', 'email firstName lastName')
      .populate('items.product', 'name sku')
      .lean();

    // Flatten order items for CSV export
    const flattenedOrders = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        flattenedOrders.push({
          orderNumber: order.orderNumber,
          orderDate: order.createdAt,
          status: order.status,
          customerName: order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Guest',
          customerEmail: order.user?.email || order.guestEmail || 'N/A',
          productName: item.product?.name || item.name,
          productSku: item.product?.sku || item.sku || 'N/A',
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          shippingAddress: order.shippingAddress ? 
            `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}` : 'N/A'
        });
      });
    });

    // Return JSON if requested
    if (format === 'json') {
      return res.json({
        success: true,
        data: flattenedOrders
      });
    }

    // Default to CSV export
    const fields = [
      'orderNumber',
      'orderDate',
      'status',
      'customerName',
      'customerEmail',
      'productName',
      'productSku',
      'quantity',
      'unitPrice',
      'totalPrice',
      'shippingAddress'
    ];

    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(flattenedOrders);

    res.header('Content-Type', 'text/csv');
    res.attachment(`orders-${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);

  } catch (error) {
    console.error('Error exporting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting orders',
      error: error.message
    });
  }
};
