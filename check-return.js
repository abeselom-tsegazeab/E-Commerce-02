import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './backend/models/order.model.js';

dotenv.config();

async function checkReturn(returnId) {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Searching for return ID:', returnId);
    
    const order = await Order.findOne(
      { 'returns.returnId': returnId },
      { 'returns.$': 1, 'orderId': 1, 'status': 1 }
    );

    if (!order) {
      console.log('Return not found in any order');
      return;
    }

    console.log('Found return in order:', {
      orderId: order._id,
      orderStatus: order.status,
      return: order.returns[0] // Since we used $ operator, returns will only have the matching element
    });

  } catch (error) {
    console.error('Error checking return:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Get return ID from command line argument or use the one from the response
const returnId = process.argv[2] || 'RTN-1760883643173-531';
checkReturn(returnId);
