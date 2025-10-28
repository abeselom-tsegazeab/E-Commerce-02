import stripe from '../config/stripe.config.js';
import { Order } from '../models/order.model.js';
import logger from '../utils/logger.js';

/**
 * Process a full or partial refund for an order
 * @param {string} paymentIntentId - Stripe Payment Intent ID
 * @param {Object} options - Refund options
 * @param {number} [options.amount] - Amount to refund in cents (for partial refunds)
 * @param {string} [options.reason] - Reason for the refund
 * @param {string} [options.metadata] - Additional metadata
 * @returns {Promise<Object>} Refund details
 */
export const processRefund = async (paymentIntentId, { amount, reason = 'requested_by_customer', metadata = {} } = {}) => {
  const requestId = `refund_${Date.now()}`;
  
  try {
    logger.info('Processing refund', { requestId, paymentIntentId, amount, reason });

    // Get the payment intent to verify the charge exists
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent.charges.data.length) {
      throw new Error('No charge found for this payment intent');
    }

    const chargeId = paymentIntent.charges.data[0].id;
    
    // Create the refund
    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount,
      reason,
      metadata: {
        ...metadata,
        requestId,
        processedAt: new Date().toISOString()
      }
    });

    // Update order status in database
    const order = await Order.findOneAndUpdate(
      { 'paymentDetails.paymentIntentId': paymentIntentId },
      {
        $set: {
          'paymentDetails.status': 'refunded',
          'paymentDetails.refundId': refund.id,
          'paymentDetails.refundedAt': new Date(),
          'paymentDetails.refundAmount': amount || paymentIntent.amount
        },
        $push: {
          'paymentDetails.refundHistory': {
            refundId: refund.id,
            amount: amount || paymentIntent.amount,
            reason,
            status: refund.status,
            processedAt: new Date(),
            metadata
          }
        }
      },
      { new: true }
    );

    if (!order) {
      logger.warn('Order not found for payment intent', { paymentIntentId });
    }

    logger.info('Refund processed successfully', { 
      requestId, 
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status
    });

    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status,
      orderId: order?._id
    };

  } catch (error) {
    logger.error('Error processing refund', { 
      requestId, 
      paymentIntentId,
      error: {
        message: error.message,
        code: error.code,
        type: error.type
      }
    });
    
    throw error;
  }
};

/**
 * Get refund status
 * @param {string} refundId - Stripe Refund ID
 * @returns {Promise<Object>} Refund details
 */
export const getRefundStatus = async (refundId) => {
  try {
    const refund = await stripe.refunds.retrieve(refundId);
    return {
      id: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
      charge: refund.charge,
      created: new Date(refund.created * 1000),
      paymentIntent: refund.payment_intent
    };
  } catch (error) {
    logger.error('Error fetching refund status', { refundId, error: error.message });
    throw error;
  }
};
