import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Stripe Configuration Module
 * 
 * This module provides a configured Stripe instance with:
 * - Environment-based configuration
 * - Input validation for required credentials
 * - Secure API versioning
 * - Common payment operations
 */

// Validate required environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

// Configure Stripe with API version and settings
const stripeConfig = {
  apiVersion: '2023-10-16', // Pin to specific API version for stability
  maxNetworkRetries: 2,     // Auto-retry failed requests up to 2 times
  timeout: 10000,           // 10 second timeout
  telemetry: true,          // Help Stripe improve their SDK
};

// Initialize Stripe with configuration
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, stripeConfig);

/**
 * Create a payment intent for a specific amount
 * @param {number} amount - Amount in smallest currency unit (e.g., cents)
 * @param {string} currency - Three-letter ISO currency code (e.g., 'usd')
 * @param {string} customerId - Optional Stripe customer ID
 * @returns {Promise<Stripe.PaymentIntent>} The created payment intent
 */
export const createPaymentIntent = async (amount, currency = 'usd', customerId = null) => {
  try {
    const params = {
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { integration_check: 'accept_a_payment' },
    };

    if (customerId) {
      params.customer = customerId;
    }

    return await stripe.paymentIntents.create(params);
  } catch (error) {
    console.error('Error creating payment intent:', error.message);
    throw new Error(`Payment processing error: ${error.message}`);
  }
};

/**
 * Create a checkout session for one-time payments
 * @param {string} priceId - Stripe price ID
 * @param {number} quantity - Number of items
 * @param {string} successUrl - URL to redirect on success
 * @param {string} cancelUrl - URL to redirect on cancel
 * @param {string} customerEmail - Optional customer email
 * @returns {Promise<Stripe.Checkout.Session>} The created checkout session
 */
export const createCheckoutSession = async (
  priceId,
  quantity,
  successUrl,
  cancelUrl,
  customerEmail = null
) => {
  try {
    const sessionParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    return await stripe.checkout.sessions.create(sessionParams);
  } catch (error) {
    console.error('Error creating checkout session:', error.message);
    throw new Error(`Checkout error: ${error.message}`);
  }
};

/**
 * Handle Stripe webhook events
 * @param {string} payload - Raw request body
 * @param {string} signature - Stripe signature from request headers
 * @param {string} webhookSecret - Webhook signing secret
 * @returns {Promise<Stripe.Event>} The Stripe event object
 */
export const handleWebhook = async (payload, signature, webhookSecret) => {
  if (!webhookSecret) {
    throw new Error('Webhook secret is required for signature verification');
  }

  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    throw new Error('Invalid webhook signature');
  }
};

/**
 * Get or create a customer in Stripe
 * @param {string} email - Customer email
 * @param {string} name - Customer name
 * @returns {Promise<Stripe.Customer>} The Stripe customer object
 */
export const getOrCreateCustomer = async (email, name = '') => {
  try {
    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    // Create new customer if not exists
    return await stripe.customers.create({
      email,
      name,
    });
  } catch (error) {
    console.error('Error managing customer:', error.message);
    throw new Error(`Customer management error: ${error.message}`);
  }
};
