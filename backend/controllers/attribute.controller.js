import Attribute from '../models/attribute.model.js';
import { validationResult } from 'express-validator';

/**
 * @desc    Create a new attribute
 * @route   POST /api/attributes
 * @access  Private/Admin
 */
export const createAttribute = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, type, values, isRequired, categoryId } = req.body;
        
        // Check if attribute already exists
        const attributeExists = await Attribute.findOne({ name });
        if (attributeExists) {
            return res.status(400).json({
                success: false,
                message: 'Attribute with this name already exists'
            });
        }

        const attribute = new Attribute({
            name,
            type,
            values: values || [],
            isRequired: isRequired || false,
            categoryId: categoryId || null
        });

        const createdAttribute = await attribute.save();
        
        res.status(201).json({
            success: true,
            data: createdAttribute
        });
    } catch (error) {
        console.error('Error creating attribute:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get all attributes
 * @route   GET /api/attributes
 * @access  Private
 */
export const getAllAttributes = async (req, res) => {
    try {
        const { category } = req.query;
        const query = {};
        
        if (category) {
            query.categoryId = category;
        }
        
        const attributes = await Attribute.find(query).sort({ name: 1 });
        
        res.status(200).json({
            success: true,
            count: attributes.length,
            data: attributes
        });
    } catch (error) {
        console.error('Error getting attributes:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get attribute by ID
 * @route   GET /api/attributes/:id
 * @access  Private
 */
export const getAttributeById = async (req, res) => {
    try {
        const attribute = await Attribute.findById(req.params.id);
        
        if (!attribute) {
            return res.status(404).json({
                success: false,
                message: 'Attribute not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: attribute
        });
    } catch (error) {
        console.error('Error getting attribute:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Update attribute
 * @route   PUT /api/attributes/:id
 * @access  Private/Admin
 */
export const updateAttribute = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, type, values, isRequired, categoryId } = req.body;
        
        const attribute = await Attribute.findById(req.params.id);
        
        if (!attribute) {
            return res.status(404).json({
                success: false,
                message: 'Attribute not found'
            });
        }

        // Check if name is being updated and if it's already taken
        if (name && name !== attribute.name) {
            const attributeExists = await Attribute.findOne({ name });
            if (attributeExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Attribute with this name already exists'
                });
            }
        }

        attribute.name = name || attribute.name;
        attribute.type = type || attribute.type;
        if (values) attribute.values = values;
        if (isRequired !== undefined) attribute.isRequired = isRequired;
        if (categoryId !== undefined) attribute.categoryId = categoryId;
        
        const updatedAttribute = await attribute.save();
        
        res.status(200).json({
            success: true,
            data: updatedAttribute
        });
    } catch (error) {
        console.error('Error updating attribute:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Delete attribute
 * @route   DELETE /api/attributes/:id
 * @access  Private/Admin
 */
export const deleteAttribute = async (req, res) => {
    try {
        const attribute = await Attribute.findByIdAndDelete(req.params.id);
        
        if (!attribute) {
            return res.status(404).json({
                success: false,
                message: 'Attribute not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Attribute removed',
            data: {}
        });
    } catch (error) {
        console.error('Error deleting attribute:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get attributes by category
 * @route   GET /api/attributes/category/:categoryId
 * @access  Private
 */
export const getAttributesByCategory = async (req, res) => {
    try {
        const attributes = await Attribute.find({
            $or: [
                { categoryId: req.params.categoryId },
                { categoryId: null } // Global attributes
            ]
        }).sort({ isRequired: -1, name: 1 });
        
        res.status(200).json({
            success: true,
            count: attributes.length,
            data: attributes
        });
    } catch (error) {
        console.error('Error getting attributes by category:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get attribute values
 * @route   GET /api/attributes/values/:attributeId
 * @access  Private
 */
export const getAttributeValues = async (req, res) => {
    try {
        const attribute = await Attribute.findById(req.params.attributeId);
        
        if (!attribute) {
            return res.status(404).json({
                success: false,
                message: 'Attribute not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: {
                _id: attribute._id,
                name: attribute.name,
                values: attribute.values
            }
        });
    } catch (error) {
        console.error('Error getting attribute values:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
