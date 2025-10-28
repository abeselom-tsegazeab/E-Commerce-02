import stripe from '../config/stripe.config.js';
import Subscription from '../models/subscription.model.js';
import logger from '../utils/logger.js';
import { withIdempotency } from './idempotency.service.js';

/**
 * Create a new subscription
 * @param {Object} options - Subscription options
 * @param {string} options.customerId - Stripe customer ID
 * @param {string} options.priceId - Stripe price ID for the subscription
 * @param {string} options.userId - Application user ID
 * @param {Object} [options.metadata] - Additional metadata
 * @returns {Promise<Object>} Subscription details
 */
export const createSubscription = async ({
  customerId,
  priceId,
  userId,
  metadata = {}
}) => {
  return withIdempotency({
    userId,
    operation: `create_subscription_${priceId}`,
    operationFn: async () => {
      try {
        logger.info('Creating subscription', {
          customerId,
          priceId,
          userId,
          metadata
        });

        // Create subscription in Stripe
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          payment_behavior: 'default_incomplete',
          payment_settings: { save_default_payment_method: 'on_subscription' },
          expand: ['latest_invoice.payment_intent'],
          metadata: {
            userId: userId.toString(),
            ...metadata
          }
        });

        // Save to database
        const newSubscription = new Subscription({
          userId,
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          plan: {
            priceId,
            productId: subscription.items.data[0].price.product,
            interval: subscription.items.data[0].price.recurring.interval,
            amount: subscription.items.data[0].price.unit_amount,
            currency: subscription.items.data[0].price.currency
          },
          metadata: subscription.metadata
        });

        await newSubscription.save();

        logger.info('Subscription created', {
          subscriptionId: subscription.id,
          userId,
          status: subscription.status
        });

        return {
          success: true,
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice.payment_intent.client_secret,
          status: subscription.status,
          currentPeriodEnd: newSubscription.currentPeriodEnd
        };
      } catch (error) {
        logger.error('Failed to create subscription', {
          error: error.message,
          stack: error.stack,
          customerId,
          priceId,
          userId
        });
        throw error;
      }
    }
  });
};

/**
 * Cancel a subscription
 * @param {string} subscriptionId - Stripe subscription ID
 * @param {string} userId - Application user ID
 * @param {boolean} [cancelAtPeriodEnd] - Whether to cancel at period end
 * @returns {Promise<Object>} Updated subscription details
 */
export const cancelSubscription = async (subscriptionId, userId, cancelAtPeriodEnd = true) => {
  try {
    logger.info('Cancelling subscription', {
      subscriptionId,
      userId,
      cancelAtPeriodEnd
    });

    // Update subscription in Stripe
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
      metadata: {
        cancelledBy: userId,
        cancelledAt: new Date().toISOString()
      }
    });

    // Update in database
    const updatedSubscription = await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      {
        $set: {
          status: cancelAtPeriodEnd ? 'canceling' : 'active',
          cancelAtPeriodEnd,
          cancelledAt: cancelAtPeriodEnd ? new Date() : null,
          'metadata.cancelledBy': userId,
          'metadata.cancelledAt': new Date().toISOString()
        }
      },
      { new: true }
    );

    logger.info('Subscription cancelled', {
      subscriptionId,
      status: updatedSubscription.status,
      cancelAtPeriodEnd: updatedSubscription.cancelAtPeriodEnd
    });

    return {
      success: true,
      subscriptionId: updatedSubscription.stripeSubscriptionId,
      status: updatedSubscription.status,
      cancelAtPeriodEnd: updatedSubscription.cancelAtPeriodEnd,
      currentPeriodEnd: updatedSubscription.currentPeriodEnd
    };
  } catch (error) {
    logger.error('Failed to cancel subscription', {
      error: error.message,
      stack: error.stack,
      subscriptionId,
      userId
    });
    throw error;
  }
};

/**
 * Handle subscription webhook events
 * @param {Object} event - Stripe webhook event
 * @returns {Promise<void>}
 */
export const handleSubscriptionWebhook = async (event) => {
  const subscription = event.data.object;
  const eventType = event.type;

  try {
    switch (eventType) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          {
            $set: {
              status: subscription.status,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              'plan.amount': subscription.items.data[0].price.unit_amount,
              'metadata.lastWebhook': eventType,
              'metadata.lastWebhookTime': new Date()
            },
            $setOnInsert: {
              userId: subscription.metadata?.userId,
              stripeCustomerId: subscription.customer,
              plan: {
                priceId: subscription.items.data[0].price.id,
                productId: subscription.items.data[0].price.product,
                interval: subscription.items.data[0].price.recurring.interval,
                amount: subscription.items.data[0].price.unit_amount,
                currency: subscription.items.data[0].price.currency
              }
            }
          },
          { upsert: true, new: true }
        );
        break;

      case 'customer.subscription.deleted':
        await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          {
            $set: {
              status: 'canceled',
              cancelledAt: new Date(),
              'metadata.lastWebhook': eventType,
              'metadata.lastWebhookTime': new Date()
            }
          }
        );
        break;

      // Handle other subscription events as needed
      case 'invoice.payment_succeeded':
        if (subscription.billing_reason === 'subscription_create') {
          // Handle successful subscription creation
          await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: subscription.subscription },
            {
              $set: {
                status: 'active',
                'metadata.lastPayment': new Date(),
                'metadata.lastInvoice': subscription.id
              }
            }
          );
        }
        break;

      case 'invoice.payment_failed':
        await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: subscription.subscription },
          {
            $set: {
              status: 'past_due',
              'metadata.lastPaymentAttemptFailed': true,
              'metadata.lastPaymentError': subscription.last_payment_error?.message,
              'metadata.lastInvoice': subscription.id
            }
          }
        );
        break;
    }

    logger.info('Processed subscription webhook', {
      eventType,
      subscriptionId: subscription.id,
      status: subscription.status
    });
  } catch (error) {
    logger.error('Error processing subscription webhook', {
      error: error.message,
      stack: error.stack,
      eventType,
      subscriptionId: subscription?.id
    });
    throw error;
  }
};

/**
 * Get subscription details
 * @param {string} subscriptionId - Stripe subscription ID
 * @param {string} [userId] - Optional user ID for authorization
 * @returns {Promise<Object>} Subscription details
 */
export const getSubscription = async (subscriptionId, userId) => {
  try {
    const query = { stripeSubscriptionId: subscriptionId };
    if (userId) {
      query.userId = userId;
    }

    const subscription = await Subscription.findOne(query);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    return {
      success: true,
      subscription: {
        id: subscription.stripeSubscriptionId,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        plan: subscription.plan,
        metadata: subscription.metadata
      }
    };
  } catch (error) {
    logger.error('Error getting subscription', {
      error: error.message,
      stack: error.stack,
      subscriptionId,
      userId
    });
    throw error;
  }
};
