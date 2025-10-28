import stripe from '../config/stripe.config.js';
import logger from '../utils/logger.js';

/**
 * Save a payment method for a customer
 * @param {string} customerId - Stripe customer ID
 * @param {string} paymentMethodId - Stripe payment method ID
 * @param {Object} [metadata] - Additional metadata
 * @returns {Promise<Object>} The attached payment method
 */
export const savePaymentMethod = async (customerId, paymentMethodId, metadata = {}) => {
  try {
    // Attach the payment method to the customer
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Update the payment method with metadata
    const updatedPaymentMethod = await stripe.paymentMethods.update(paymentMethodId, {
      metadata: {
        ...metadata,
        savedAt: new Date().toISOString(),
      },
    });

    logger.info('Payment method saved', {
      customerId,
      paymentMethodId,
      type: updatedPaymentMethod.type,
    });

    return updatedPaymentMethod;
  } catch (error) {
    logger.error('Error saving payment method', {
      error: error.message,
      customerId,
      paymentMethodId,
    });
    throw error;
  }
};

/**
 * Get all payment methods for a customer
 * @param {string} customerId - Stripe customer ID
 * @param {string} [type] - Type of payment method (card, sepa_debit, etc.)
 * @returns {Promise<Array>} List of payment methods
 */
export const getCustomerPaymentMethods = async (customerId, type = 'card') => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type,
    });

    return paymentMethods.data;
  } catch (error) {
    logger.error('Error fetching payment methods', {
      error: error.message,
      customerId,
      type,
    });
    throw error;
  }
};

/**
 * Set a customer's default payment method
 * @param {string} customerId - Stripe customer ID
 * @param {string} paymentMethodId - Stripe payment method ID
 * @returns {Promise<Object>} Updated customer
 */
export const setDefaultPaymentMethod = async (customerId, paymentMethodId) => {
  try {
    const customer = await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    logger.info('Default payment method updated', {
      customerId,
      paymentMethodId,
    });

    return customer;
  } catch (error) {
    logger.error('Error setting default payment method', {
      error: error.message,
      customerId,
      paymentMethodId,
    });
    throw error;
  }
};

/**
 * Remove a payment method
 * @param {string} paymentMethodId - Stripe payment method ID
 * @returns {Promise<Object>} Detached payment method
 */
export const removePaymentMethod = async (paymentMethodId) => {
  try {
    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
    
    logger.info('Payment method removed', {
      paymentMethodId,
      type: paymentMethod.type,
    });
    
    return paymentMethod;
  } catch (error) {
    logger.error('Error removing payment method', {
      error: error.message,
      paymentMethodId,
    });
    throw error;
  }
};
