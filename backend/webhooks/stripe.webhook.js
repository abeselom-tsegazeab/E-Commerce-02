import express from 'express';
import stripe from 'stripe';
import { handleSubscriptionWebhook } from '../services/subscription.service.js';
import { handleSuccessfulPayment, handleFailedPayment } from '../services/payment.service.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Stripe requires the raw body to verify the webhook signature
const rawBodySaver = (req, res, buf, encoding) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
};

// Webhook endpoint for Stripe events
router.post(
  '/',
  express.raw({ type: 'application/json', verify: rawBodySaver }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
      
      logger.info(`Received Stripe webhook: ${event.type}`, {
        eventId: event.id,
        type: event.type,
        apiVersion: event.api_version,
        requestId: event.request?.id
      });

      // Handle different event types
      switch (event.type) {
        // Subscription events
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await handleSubscriptionWebhook(event);
          break;
          
        // Payment events
        case 'payment_intent.succeeded':
          await handleSuccessfulPayment(event.data.object.id);
          break;
        case 'payment_intent.payment_failed':
        case 'charge.failed':
          await handleFailedPayment(event.data.object.id);
          break;
        case 'charge.succeeded':
          // Handle successful charge if needed
          break;
        case 'charge.refunded':
          await handlePaymentWebhook(event);
          break;
          
        // Invoice events
        case 'invoice.payment_succeeded':
        case 'invoice.payment_failed':
          await handleSubscriptionWebhook(event);
          break;
          
        // Add more event handlers as needed
        
        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      // Return a response to acknowledge receipt of the event
      res.json({ received: true });
      
    } catch (err) {
      logger.error('Webhook error:', {
        error: err.message,
        stack: err.stack,
        eventType: event?.type,
        eventId: event?.id
      });
      
      // Return error response
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

export default router;
