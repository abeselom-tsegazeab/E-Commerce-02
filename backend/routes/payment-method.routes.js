import { Router } from 'express';
import { body } from 'express-validator';
import { protectRoute } from '../middleware/auth.middleware.js';
import { 
  savePaymentMethod, 
  getCustomerPaymentMethods, 
  setDefaultPaymentMethod,
  removePaymentMethod 
} from '../services/payment-method.service.js';
import { validateRequest } from '../middleware/security.middleware.js';

const router = Router();

// Apply auth middleware to all routes
router.use(protectRoute);

/**
 * @route   POST /api/payment-methods
 * @desc    Save a payment method for the current user
 * @access  Private
 */
router.post(
  '/',
  [
    body('paymentMethodId')
      .notEmpty()
      .withMessage('Payment method ID is required')
      .isString()
      .withMessage('Invalid payment method ID'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const paymentMethod = await savePaymentMethod(
        req.user.stripeCustomerId,
        req.body.paymentMethodId,
        req.body.metadata
      );
      
      res.status(201).json({
        success: true,
        data: paymentMethod,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/payment-methods
 * @desc    Get all payment methods for the current user
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const paymentMethods = await getCustomerPaymentMethods(
      req.user.stripeCustomerId,
      req.query.type
    );
    
    res.json({
      success: true,
      data: paymentMethods,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/payment-methods/default
 * @desc    Set default payment method for the current user
 * @access  Private
 */
router.put(
  '/default',
  [
    body('paymentMethodId')
      .notEmpty()
      .withMessage('Payment method ID is required')
      .isString()
      .withMessage('Invalid payment method ID'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const customer = await setDefaultPaymentMethod(
        req.user.stripeCustomerId,
        req.body.paymentMethodId
      );
      
      res.json({
        success: true,
        data: {
          defaultPaymentMethod: customer.invoice_settings.default_payment_method,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route   DELETE /api/payment-methods/:id
 * @desc    Remove a payment method
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    await removePaymentMethod(req.params.id);
    
    res.json({
      success: true,
      message: 'Payment method removed successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
