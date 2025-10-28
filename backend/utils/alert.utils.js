import logger from './logger.js';
import Notification from '../models/notification.model.js';

/**
 * Send an alert for a failed payment (in-app notification)
 * @param {Object} paymentData - Payment data including error details
 * @returns {Promise<Object>} Created notification
 */
export async function alertFailedPayment(paymentData) {
  const { error, paymentIntent, orderId, customerEmail, userId } = paymentData;
  
  const notificationData = {
    type: 'payment_failed',
    title: 'Payment Failed',
    message: error?.message || 'Your payment could not be processed',
    userId: userId, // User to receive the notification
    data: {
      orderId,
      paymentIntentId: paymentIntent?.id,
      amount: paymentIntent?.amount ? (paymentIntent.amount / 100).toFixed(2) : '0.00',
      currency: paymentIntent?.currency?.toUpperCase() || 'USD',
      error: {
        message: error?.message,
        code: error?.code,
        type: error?.type,
      },
    },
    isRead: false,
  };

  try {
    // Log the alert
    logger.error('Payment failed alert', notificationData);
    
    // Create in-app notification
    const notification = await Notification.create(notificationData);
    
    // Here you would typically emit a real-time event using Socket.io
    // Example: io.to(userId).emit('notification', notification);
    
    return notification;
  } catch (error) {
    logger.error('Failed to create payment failure notification', {
      error: error.message,
      orderId,
      paymentIntentId: paymentIntent?.id,
    });
    throw error;
  }
}

/**
 * Send a high-value transaction alert (in-app notification)
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} Created notification
 */
export async function alertHighValueTransaction(paymentData) {
  const { amount, currency, orderId, userId } = paymentData;
  const amountInDollars = amount / 100;
  
  if (amountInDollars >= (parseFloat(process.env.HIGH_VALUE_THRESHOLD) || 1000)) {
    const notificationData = {
      type: 'high_value_transaction',
      title: 'High Value Transaction',
      message: `A high value transaction of ${amountInDollars.toFixed(2)} ${currency?.toUpperCase() || 'USD'} was processed`,
      userId: userId,
      data: {
        orderId,
        amount: amountInDollars,
        currency: currency?.toUpperCase() || 'USD',
      },
      isRead: false,
    };

    try {
      logger.warn('High value transaction', notificationData);
      
      // Create in-app notification
      const notification = await Notification.create(notificationData);
      
      // Emit real-time event if needed
      // io.to(userId).emit('notification', notification);
      
      return notification;
    } catch (error) {
      logger.error('Failed to create high value transaction notification', {
        error: error.message,
        orderId,
      });
      throw error;
    }
  }
  return null;
}
