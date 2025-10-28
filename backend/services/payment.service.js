import stripe from '../config/stripe.config.js';
import Order from '../models/order.model.js';
import logger from '../utils/logger.js';
import { alertFailedPayment, alertHighValueTransaction } from '../utils/alert.utils.js';

/**
 * Create a refund for a payment
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @param {number} amount - Amount to refund in cents (optional, full amount if not provided)
 * @param {string} reason - Reason for the refund
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Refund details
 */
export const createRefund = async (paymentIntentId, amount = null, reason = 'requested_by_customer', metadata = {}) => {
  try {
    const refundParams = {
      payment_intent: paymentIntentId,
      reason,
      metadata: {
        ...metadata,
        processedAt: new Date().toISOString(),
      },
    };

    if (amount) {
      refundParams.amount = amount;
    }

    const refund = await stripe.refunds.create(refundParams);

    logger.info('Refund created', {
      paymentIntentId,
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status,
    });

    // Update order status in your database
    await Order.findOneAndUpdate(
      { paymentIntentId },
      {
        $push: {
          refunds: {
            refundId: refund.id,
            amount: refund.amount / 100, // Convert back to dollars
            currency: refund.currency,
            reason: refund.reason,
            status: refund.status,
            metadata: refund.metadata,
          },
        },
        $set: { status: 'refunded' },
      },
      { new: true }
    );

    return refund;
  } catch (error) {
    logger.error('Error creating refund', {
      error: error.message,
      paymentIntentId,
      amount,
      reason,
    });
    throw error;
  }
};

/**
 * Get refund details
 * @param {string} refundId - Stripe refund ID
 * @returns {Promise<Object>} Refund details
 */
export const getRefund = async (refundId) => {
  try {
    const refund = await stripe.refunds.retrieve(refundId);
    return refund;
  } catch (error) {
    logger.error('Error fetching refund', {
      error: error.message,
      refundId,
    });
    throw error;
  }
};

// Existing imports and other functions...

/**
 * Create a payment intent for an order
 * @param {Object} order - The order object
 * @param {string} customerEmail - Customer's email
 * @returns {Promise<Object>} Payment intent
 */
export const createPaymentIntent = async (order, customerEmail) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
        userId: order.user.toString(),
      },
      receipt_email: customerEmail,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
};

/**
 * Handle successful payment
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @returns {Promise<Object>} Updated order
 */
export const handleSuccessfulPayment = async (paymentIntentId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    const order = await Order.findByIdAndUpdate(
      paymentIntent.metadata.orderId,
      {
        paymentStatus: 'paid',
        status: 'processing',
        'paymentDetails.paymentIntentId': paymentIntent.id,
        'paymentDetails.amountPaid': paymentIntent.amount / 100, // Convert back to dollars
        'paymentDetails.receiptUrl': paymentIntent.charges.data[0]?.receipt_url || '',
      },
      { new: true, session }
    );

    if (!order) {
      throw new Error('Order not found');
    }

    await session.commitTransaction();
    return order;
  } catch (error) {
    await session.abortTransaction();
    console.error('Error handling successful payment:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Handle payment failure
 * @param {string} paymentIntentId - Stripe payment intent ID
 */
export const handleFailedPayment = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['payment_method']
    });

    // Get the related order if it exists
    const order = await Order.findOne({ paymentIntentId });
    
    // Prepare alert data
    const alertData = {
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        customer: paymentIntent.customer,
        payment_method: paymentIntent.payment_method
      },
      error: paymentIntent.last_payment_error || { message: 'Unknown payment error' },
      orderId: order?._id?.toString(),
      customerEmail: paymentIntent.receipt_email || paymentIntent.metadata?.email
    };

    // Send alert for failed payment
    await alertFailedPayment(alertData);

    // Update order status if order exists
    if (order) {
      order.status = 'payment_failed';
      order.paymentStatus = 'failed';
      order.error = {
        message: paymentIntent.last_payment_error?.message || 'Payment failed',
        code: paymentIntent.last_payment_error?.code,
        type: paymentIntent.last_payment_error?.type,
        decline_code: paymentIntent.last_payment_error?.decline_code,
      };
      await order.save();
      
      logger.info('Order updated with payment failure', {
        orderId: order._id,
        paymentIntentId,
        status: 'payment_failed'
      });
    }
    
  } catch (error) {
    logger.error('Error handling failed payment', {
      paymentIntentId,
      error: error.message,
      stack: error.stack
    });
    
    // Even if we can't process the full failure, try to send an alert
    try {
      await alertFailedPayment({
        paymentIntent: { id: paymentIntentId },
        error: { message: error.message },
        orderId: null,
        customerEmail: null
      });
    } catch (alertError) {
      logger.error('Failed to send failure alert', {
        originalError: error.message,
        alertError: alertError.message
      });
    }
    
    throw error;
  }
};
