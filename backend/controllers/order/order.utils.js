import Order from '../../models/order.model.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate an order number
 * @returns {string} Unique order number
 */
export const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${year}${month}-${random}`;
};

/**
 * Generate a tracking number
 * @returns {string} Unique tracking number
 */
export const generateTrackingNumber = () => {
  return `TRK-${uuidv4().substring(0, 10).toUpperCase()}`;
};

/**
 * Get order status history
 * @param {string} orderId - Order ID
 * @returns {Promise<Array>} Status history
 */
export const getOrderStatusHistory = async (orderId) => {
  const order = await Order.findById(orderId).select('statusHistory');
  return order?.statusHistory || [];
};

/**
 * Add status to order history
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 * @param {string} note - Optional note
 * @returns {Promise<void>}
 */
export const addToStatusHistory = async (orderId, status, note = '') => {
  await Order.findByIdAndUpdate(orderId, {
    $push: {
      statusHistory: {
        status,
        date: new Date(),
        note
      }
    }
  });
};

export default {
  generateOrderNumber,
  generateTrackingNumber,
  getOrderStatusHistory,
  addToStatusHistory
};
