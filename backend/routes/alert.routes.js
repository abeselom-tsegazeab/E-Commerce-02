import express from 'express';
import {protectRoute as protect } from '../middleware/auth.middleware.js';
import {
  createAlert,
  getUserAlerts,
  deleteAlert
} from '../controllers/alert.controller.js';

const router = express.Router();

// Protected routes (require authentication)
router.use(protect);

// Create a new alert
router.post('/', createAlert);

// Get user's alerts
router.get('/', getUserAlerts);

// Delete an alert
router.delete('/:id', deleteAlert);

export default router;
