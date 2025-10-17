import Product from '../models/product.model.js';
import User from '../models/user.model.js';

/**
 * @desc    Add product to comparison list
 * @route   POST /api/comparison
 * @access  Private
 */
export const addToComparison = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user._id;

        // Validate product ID
        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Get user and update comparison list
        const user = await User.findById(userId);
        
        // Check if product is already in comparison
        if (user.comparisonList.includes(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Product already in comparison list'
            });
        }

        // Add to comparison (limit to 5 products)
        if (user.comparisonList.length >= 5) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 5 products can be compared at once'
            });
        }

        user.comparisonList.push(productId);
        await user.save();

        // Populate product details for response
        await user.populate('comparisonList');

        res.status(200).json({
            success: true,
            data: user.comparisonList,
            count: user.comparisonList.length
        });

    } catch (error) {
        console.error('Error adding to comparison:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get user's comparison list
 * @route   GET /api/comparison
 * @access  Private
 */
export const getComparison = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const user = await User.findById(userId).populate({
            path: 'comparisonList',
            select: 'name price images description specifications'
        });

        res.status(200).json({
            success: true,
            count: user.comparisonList.length,
            data: user.comparisonList
        });

    } catch (error) {
        console.error('Error getting comparison list:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Remove product from comparison list
 * @route   DELETE /api/comparison/:productId
 * @access  Private
 */
export const removeFromComparison = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        const user = await User.findById(userId);
        
        // Remove product from comparison list
        user.comparisonList = user.comparisonList.filter(
            id => id.toString() !== productId
        );
        
        await user.save();
        await user.populate('comparisonList');

        res.status(200).json({
            success: true,
            message: 'Product removed from comparison',
            data: user.comparisonList,
            count: user.comparisonList.length
        });

    } catch (error) {
        console.error('Error removing from comparison:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Clear comparison list
 * @route   DELETE /api/comparison
 * @access  Private
 */
export const clearComparison = async (req, res) => {
    try {
        const userId = req.user._id;
        
        await User.findByIdAndUpdate(userId, { 
            $set: { comparisonList: [] } 
        });

        res.status(200).json({
            success: true,
            message: 'Comparison list cleared',
            data: [],
            count: 0
        });

    } catch (error) {
        console.error('Error clearing comparison list:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get comparison attributes for products in comparison list
 * @route   GET /api/comparison/attributes
 * @access  Private
 */
export const getComparisonAttributes = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const user = await User.findById(userId).populate({
            path: 'comparisonList',
            select: 'name specifications'
        });

        if (user.comparisonList.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Add at least 2 products to compare'
            });
        }

        // Get all unique attribute keys from all products
        const allAttributes = new Set();
        user.comparisonList.forEach(product => {
            if (product.specifications) {
                Object.keys(product.specifications).forEach(key => {
                    allAttributes.add(key);
                });
            }
        });

        // Create comparison data structure
        const comparisonData = Array.from(allAttributes).map(attr => {
            const attributeData = {
                name: attr,
                values: {}
            };

            // Add values for each product
            user.comparisonList.forEach(product => {
                attributeData.values[product._id] = product.specifications?.[attr] || 'N/A';
            });

            return attributeData;
        });

        res.status(200).json({
            success: true,
            products: user.comparisonList.map(p => ({
                _id: p._id,
                name: p.name
            })),
            attributes: comparisonData
        });

    } catch (error) {
        console.error('Error getting comparison attributes:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
