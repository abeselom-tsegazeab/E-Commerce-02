import logger from './logger.js';

// TODO: Implement notification system in the final stage

/**
 * Send an alert for a failed payment (in-app notification)
 * @param {Object} paymentData - Payment data including error details
 * @returns {Promise<Object>} Created notification
 */
export async function alertFailedPayment(paymentData) {
  const { error, paymentIntent, orderId } = paymentData;
  
  // Just log the error for now
  logger.error('Payment failed', {
    orderId,
    paymentIntentId: paymentIntent?.id,
    error: {
      message: error?.message,
      code: error?.code,
      type: error?.type,
    },
    amount: paymentIntent?.amount ? (paymentIntent.amount / 100).toFixed(2) : '0.00',
    currency: paymentIntent?.currency?.toUpperCase() || 'USD',
    timestamp: new Date().toISOString()
  });
  
  // Return a simple response indicating the error was logged
  return { logged: true, timestamp: new Date().toISOString() };
}

/**
 * Send a high-value transaction alert (in-app notification)
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} Created notification
 */
export async function alertHighValueTransaction(paymentData) {
  const { amount, currency, orderId } = paymentData;
  const amountInDollars = amount / 100;
  
  if (amountInDollars >= (parseFloat(process.env.HIGH_VALUE_THRESHOLD) || 1000)) {
    logger.warn('High value transaction processed', {
      orderId,
      amount: amountInDollars,
      currency: currency?.toUpperCase() || 'USD',
      timestamp: new Date().toISOString()
    });
    return { logged: true, isHighValue: true, timestamp: new Date().toISOString() };
  }
  return { logged: true, isHighValue: false };
}
