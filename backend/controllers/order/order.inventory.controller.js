import Product from '../../models/product.model.js';
import Order from '../../models/order.model.js';

/**
 * Update inventory levels based on order status changes
 * @param {Object} order - The order document
 * @param {string} previousStatus - The previous order status
 * @returns {Promise<void>}
 */
export const updateInventory = async (order, previousStatus) => {
  const session = await Product.startSession();
  session.startTransaction();

  try {
    // If order is being cancelled or refunded, return stock
    if ((order.status === 'cancelled' || order.status === 'refunded') && 
        previousStatus !== 'cancelled' && previousStatus !== 'refunded') {
      await returnStockToInventory(order.items, session);
    } 
    // If order is being processed and wasn't in a processing state before
    else if ((order.status === 'processing' || order.status === 'shipped') && 
             !['processing', 'shipped', 'delivered'].includes(previousStatus)) {
      await reduceStockFromInventory(order.items, session);
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating inventory:', error);
    // Don't throw the error to prevent order update from failing
    // The inventory can be updated manually if needed
  } finally {
    session.endSession();
  }
};

/**
 * Reduce stock levels for products in the order
 * @param {Array} items - Order items
 * @param {Object} session - MongoDB session
 * @returns {Promise<void>}
 */
async function reduceStockFromInventory(items, session) {
  for (const item of items) {
    const product = await Product.findById(item.product).session(session);
    if (!product) continue;

    // Only reduce stock if product tracks inventory
    if (product.trackInventory && product.inStock >= item.quantity) {
      product.inStock -= item.quantity;
      product.sold += item.quantity;
      product.lastStockUpdate = new Date();
      await product.save({ session });
    } else if (product.trackInventory) {
      // Handle insufficient stock - could throw an error or handle backorder
      console.warn(`Insufficient stock for product ${product._id}`);
    }
  }
}

/**
 * Return stock to inventory for cancelled/refunded orders
 * @param {Array} items - Order items
 * @param {Object} session - MongoDB session
 * @returns {Promise<void>}
 */
async function returnStockToInventory(items, session) {
  for (const item of items) {
    const product = await Product.findById(item.product).session(session);
    if (!product) continue;

    if (product.trackInventory) {
      product.inStock += item.quantity;
      product.sold = Math.max(0, product.sold - item.quantity);
      product.lastStockUpdate = new Date();
      await product.save({ session });
    }
  }
}

/**
 * Check current stock levels for products
 * @param {Array} items - Array of { product: id, quantity: number }
 * @returns {Promise<{inStock: boolean, items: Array}>}
 */
export const checkStockLevels = async (items) => {
  const productIds = items.map(item => item.product);
  const products = await Product.find({ _id: { $in: productIds } });
  
  const result = {
    inStock: true,
    items: []
  };

  for (const item of items) {
    const product = products.find(p => p._id.toString() === item.product.toString());
    if (!product) {
      result.items.push({
        product: item.product,
        available: 0,
        requested: item.quantity,
        inStock: false,
        message: 'Product not found'
      });
      result.inStock = false;
      continue;
    }

    const available = product.inStock;
    const inStock = !product.trackInventory || available >= item.quantity;
    
    if (!inStock) {
      result.inStock = false;
    }

    result.items.push({
      product: item.product,
      name: product.name,
      sku: product.sku,
      available,
      requested: item.quantity,
      inStock,
      trackInventory: product.trackInventory
    });
  }

  return result;
};

/**
 * Get low stock alerts
 * @param {number} threshold - Threshold for low stock alert
 * @returns {Promise<Array>} - Array of products below threshold
 */
export const getLowStockAlerts = async (threshold = 10) => {
  return Product.find({
    trackInventory: true,
    inStock: { $gt: 0, $lte: threshold },
    active: true
  }).sort({ inStock: 1 });
};

/**
 * Get backordered items
 * @returns {Promise<Array>} - Array of backordered items
 */
export const getBackorderedItems = async () => {
  return Order.aggregate([
    {
      $unwind: '$items'
    },
    {
      $match: {
        'items.backordered': true,
        'status': { $nin: ['cancelled', 'refunded'] }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product'
      }
    },
    {
      $unwind: '$product'
    },
    {
      $group: {
        _id: {
          productId: '$product._id',
          orderId: '$_id'
        },
        product: { $first: '$product' },
        orderNumber: { $first: '$orderNumber' },
        quantity: { $first: '$items.quantity' },
        date: { $first: '$createdAt' }
      }
    },
    {
      $sort: { date: -1 }
    }
  ]);
};
