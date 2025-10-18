import mongoose from 'mongoose';
import Order from '../../models/order.model.js';
import Product from '../../models/product.model.js';

/**
 * @typedef {Object} OrderItemInput
 * @property {string} product - Product ID
 * @property {string} [variant] - Selected variant ID if applicable
 * @property {number} quantity - Quantity of the product
 */

/**
 * @typedef {Object} ShippingAddress
 * @property {string} street
 * @property {string} city
 * @property {string} state
 * @property {string} postalCode
 * @property {string} country
 */

/**
 * @typedef {Object} CreateOrderInput
 * @property {OrderItemInput[]} items - Array of order items
 * @property {ShippingAddress} shippingAddress - Shipping address
 * @property {string} [customerNotes] - Optional customer notes
 * @property {boolean} [isGuest] - Whether this is a guest checkout
 * @property {string} [guestEmail] - Required if isGuest is true
 */

/**
 * Create a new order
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, shippingAddress, customerNotes, isGuest = false, guestEmail } = req.body;
    
    // Log the incoming request for debugging
    console.log('Order request - User:', req.user ? req.user.email : 'guest', 'isGuest:', isGuest);
    
    // For guest checkout
    if (isGuest) {
      if (!guestEmail) {
        return res.status(400).json({
          success: false,
          message: 'Guest email is required for guest checkout'
        });
      }
    } 
    // For authenticated users
    else if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User must be authenticated or use guest checkout'
      });
    }

    const userId = req.user?.id;  // Using req.user.id instead of _id

    // Process order items
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) {
        throw new Error(`Product not found: ${item.product}`);
      }

      // Check if product has enough stock
      if (product.quantity < item.quantity) {
        throw new Error(`Insufficient stock for product: ${product.name}`);
      }

      // Calculate item total
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      // Update product stock
      product.quantity -= item.quantity;
      await product.save({ session });

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        variant: item.variant || null
      });
    }

    // Create the order with a temporary unique ID for stripeSessionId if not provided
    const order = new Order({
      user: isGuest ? null : userId,
      products: orderItems,
      totalAmount,
      shippingAddress,
      customerNotes,
      isGuest,
      guestEmail: isGuest ? guestEmail : undefined,
      status: 'pending',
      paymentStatus: 'pending',
      stripeSessionId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error creating order:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    const response = {
      success: false,
      message: error.message || 'Error creating order'
    };

    if (process.env.NODE_ENV === 'development') {
      response.error = error.message;
      response.stack = error.stack;
    }

    res.status(statusCode).json(response);
  }
};

/**
 * Get order by ID
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'admin';

    console.log('Fetching order:', { orderId, userId, isAdmin });

    // Validate orderId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      console.log('Invalid order ID format:', orderId);
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
        orderId
      });
    }

    const order = await Order.findById(orderId)
      .populate('user', 'name email')
      .populate('products.product', 'name price');

    console.log('Order found:', order ? 'yes' : 'no');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        orderId // Return the ID that was searched for
      });
    }

    // For debugging
    console.log('Order user ID:', order.user?._id || order.user);
    console.log('Request user ID:', userId);
    console.log('Is admin?', isAdmin);

    // Check if user is authorized to view this order
    const orderUserId = order.user?._id?.toString() || order.user?.toString();
    if (!isAdmin && orderUserId !== userId?.toString()) {
      console.log('Unauthorized access attempt:', { orderUserId, userId });
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error in getOrderById:', {
      error: error.message,
      stack: error.stack,
      params: req.params,
      user: req.user
    });
    
    res.status(500).json({
      success: false,
      message: 'Error retrieving order details',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack
      })
    });
  }
};

/**
 * Get orders for current user
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
export const getUserOrders = async (req, res) => {
  try {
    // Debug logging
    console.log('User in getUserOrders:', req.user);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = req.user.id;
    console.log('Fetching orders for user ID:', userId);
    
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('products.product', 'name price')
      .lean();

    console.log(`Found ${orders.length} orders for user ${userId}`);
    
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error in getUserOrders:', {
      error: error.message,
      stack: error.stack,
      user: req.user
    });
    
    res.status(500).json({
      success: false,
      message: 'Error retrieving user orders',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack
      })
    });
  }
};

/**
 * Update order status (Admin only)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
export const updateOrderStatus = async (req, res) => {
  try {
   const { orderId: id } = req.params
   
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

/**
 * Cancel an order (User)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
export const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId:id } = req.params;
    console.log('orderId:', id)
    const userId = req.user.id;  // Changed from _id to id

    console.log(`[DEBUG] Attempting to cancel order. Order ID: ${id}, User ID: ${userId}`);

    // First, check if the order exists
    console.log(`[DEBUG] Querying order with ID: ${id}`);
    const order = await Order.findById(id).session(session);
    
    if (!order) {
      console.log(`[DEBUG] Order ${id} not found in the database.`);
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if the order belongs to the user
    if (order.user.toString() !== userId.toString()) {
      console.log(`[DEBUG] User ${userId} is not authorized to cancel order ${id}. Order belongs to user ${order.user}`);
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if the order is in a cancellable state
    const cancellableStatuses = ['pending', 'processing'];
    if (!cancellableStatuses.includes(order.status)) {
      console.log(`[DEBUG] Order ${id} cannot be cancelled because its status is ${order.status}`);
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already ${order.status}`
      });
    }

    console.log(`[DEBUG] Restoring quantities for order ${id}`);
    // Restore product quantities
    for (const item of order.products) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: item.quantity } },
        { session }
      );
    }

    // Update order status
    order.status = 'cancelled';
    order.updatedAt = new Date();
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    console.log(`[DEBUG] Order ${id} cancelled successfully`);
    res.status(200).json({
      success: true,
      data: order,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('[ERROR] Error in cancelOrder:', {
      error: error.message,
      stack: error.stack,
      params: req.params,
      user: req.user
    });
    
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack
      })
    });
  }
};

/**
 * Get all orders (Admin only)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
export const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      populate: [
        { path: 'user', select: 'name email' },
        { path: 'products.product', select: 'name price' }
      ]
    };

    const orders = await Order.paginate(query, options);

    res.status(200).json({
      success: true,
      ...orders
    });
  } catch (error) {
    console.error('Error getting all orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving orders',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

/**
 * Get order analytics (Admin only)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
export const getOrderAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const [totalSales, ordersByStatus, recentOrders] = await Promise.all([
      // Total sales
      Order.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      // Orders by status
      Order.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Recent orders
      Order.find(match)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email')
    ]);

    const analytics = {
      totalSales: totalSales[0]?.total || 0,
      totalOrders: await Order.countDocuments(match),
      ordersByStatus: ordersByStatus.reduce((acc, curr) => ({
        ...acc,
        [curr._id]: curr.count
      }), {}),
      recentOrders
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting order analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving analytics',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};