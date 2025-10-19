import Order from '../models/order.model.js';

class OrderStatusService {
  static statusTransitions = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'on-hold', 'cancelled'],
    shipped: ['delivered', 'returned'],
    delivered: ['returned', 'refunded'],
    'on-hold': ['processing', 'cancelled'],
    backordered: ['processing', 'cancelled']
  };

  static async updateStatus(orderId, newStatus, userId = null) {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    if (!this.isValidTransition(order.status, newStatus)) {
      throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
    }

    const previousStatus = order.status;
    order.status = newStatus;

    // Add status history
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: newStatus,
      changedBy: userId,
      changedAt: new Date(),
      previousStatus
    });

    await order.save();
    return order;
  }

  static isValidTransition(currentStatus, newStatus) {
    const allowedTransitions = this.statusTransitions[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  static async getStatusHistory(orderId) {
    const order = await Order.findById(orderId).select('statusHistory');
    return order?.statusHistory || [];
  }
}

export default OrderStatusService;
