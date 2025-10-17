import express from 'express';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';
import {
  createAttribute,
  getAllAttributes,
  getAttributeById,
  updateAttribute,
  deleteAttribute,
  getAttributesByCategory,
  getAttributeValues
} from '../controllers/attribute.controller.js';

/**
 * Attribute Routes
 * 
 * This module provides API endpoints for managing product attributes.
 * All routes require authentication, and write operations require admin privileges.
 * Attributes are used to define product specifications and variations.
 */

const router = express.Router();

/**
 * @route   GET /api/attributes
 * @desc    Get all attributes
 * @access  Private
 * @header  {string}  Authorization  Bearer token
 * @query   {string}  [category]     Filter attributes by category ID
 * @returns {Object}  List of attributes
 * 
 * @response {Object} 200 - Success response with attributes
 * @response {Object} 401 - Unauthorized
 * 
 * @example
 * // Response example
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "_id": "60d21b4667d0d8992e610c85",
 *       "name": "Color",
 *       "type": "select",
 *       "values": ["Red", "Blue", "Green"],
 *       "isRequired": true
 *     }
 *   ]
 * }
 */
router.get('/', protectRoute, getAllAttributes);

/**
 * @route   GET /api/attributes/category/:categoryId
 * @desc    Get attributes by category
 * @access  Private
 * @param   {string}  categoryId  Category ID
 * @returns {Object}  List of attributes for the category
 */
router.get('/category/:categoryId', protectRoute, getAttributesByCategory);

/**
 * @route   GET /api/attributes/values/:attributeId
 * @desc    Get values for an attribute
 * @access  Private
 * @param   {string}  attributeId  Attribute ID
 * @returns {Object}  List of attribute values
 */
router.get('/values/:attributeId', protectRoute, getAttributeValues);

/**
 * @route   POST /api/attributes
 * @desc    Create a new attribute (Admin only)
 * @access  Private/Admin
 * @body    {Object}  Attribute data
 * @returns {Object}  Created attribute
 */
router.post('/', protectRoute, adminRoute, createAttribute);

/**
 * @route   GET /api/attributes/:id
 * @desc    Get attribute by ID
 * @access  Private
 * @param   {string}  id  Attribute ID
 * @returns {Object}  Attribute details
 */
router.get('/:id', protectRoute, getAttributeById);

/**
 * @route   PUT /api/attributes/:id
 * @desc    Update attribute (Admin only)
 * @access  Private/Admin
 * @param   {string}  id  Attribute ID
 * @body    {Object}  Updated attribute data
 * @returns {Object}  Updated attribute
 */
router.put('/:id', protectRoute, adminRoute, updateAttribute);

/**
 * @route   DELETE /api/attributes/:id
 * @desc    Delete attribute (Admin only)
 * @access  Private/Admin
 * @param   {string}  id  Attribute ID
 * @returns {Object}  Success message
 */
router.delete('/:id', protectRoute, adminRoute, deleteAttribute);

export default router;
