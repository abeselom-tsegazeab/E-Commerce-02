import { Router } from 'express';
import { body, param } from 'express-validator';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';
import { createRefund, getRefund } from '../services/payment.service.js';
import { validateRequest } from '../middleware/security.middleware.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @route   POST /api/refunds
 * @desc    Create a refund
 * @access  Private (Admin)
 */
router.post(
  '/',
  protectRoute,
  adminRoute,
  [
    body('paymentIntentId')
      .notEmpty()
      .withMessage('Payment intent ID is required')
      .isString()
      .withMessage('Invalid payment intent ID'),
    body('amount')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Amount must be a positive integer'),
    body('reason')
      .optional()
      .isString()
      .withMessage('Reason must be a string')
  ],
  validateRequest,
  async (req, res) => {
    const requestId = `refund_${Date.now()}`;
    const { paymentIntentId, amount, reason } = req.body;
    
    try {
      logger.info('Processing refund', {
        requestId,
        paymentIntentId,
        amount,
        adminId: req.user.id,
      });

      const refund = await createRefund(
        paymentIntentId,
        amount,
        reason || 'requested_by_customer',
        {
          adminId: req.user.id,
          adminEmail: req.user.email,
          requestId,
          ...req.body.metadata,
        }
      );

      res.status(201).json({
        success: true,
        data: refund,
      });
    } catch (error) {
      logger.error('Refund processing failed', {
        requestId,
        paymentIntentId,
        error: error.message,
        stack: error.stack
      });
      
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to process refund',
      });
    }
  }
);

/**
 * @route   GET /api/refunds/:id
 * @desc    Get refund details
 * @access  Private (Admin)
 */
router.get(
  '/:id',
  protectRoute,
  adminRoute,
  [
    param('id')
      .notEmpty()
      .withMessage('Refund ID is required')
      .isString()
      .withMessage('Invalid refund ID')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const refund = await getRefund(req.params.id);
      
      res.json({
        success: true,
        data: refund,
      });
    } catch (error) {
      logger.error('Failed to fetch refund', {
        refundId: req.params.id,
        error: error.message,
        stack: error.stack
      });
      
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to fetch refund details',
      });
    }
  }
);

export default router;
