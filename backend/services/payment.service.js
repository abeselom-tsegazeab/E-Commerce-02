import stripe from '../config/stripe.config.js';
import Order from '../models/order.model.js';

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
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    await Order.findByIdAndUpdate(
      paymentIntent.metadata.orderId,
      {
        paymentStatus: 'failed',
        status: 'pending',
      }
    );
  } catch (error) {
    console.error('Error handling failed payment:', error);
    throw error;
  }
};
