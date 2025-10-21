import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

async function fixStripeSessionIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Dynamically import the Order model
    const { default: Order } = await import('./backend/models/order.model.js');
    
    // Drop the existing index if it exists
    try {
      await Order.collection.dropIndex('stripeSessionId_1');
      console.log('Dropped existing stripeSessionId index');
    } catch (err) {
      if (err.codeName !== 'NamespaceNotFound' && err.codeName !== 'IndexNotFound') {
        throw err;
      }
      console.log('No existing stripeSessionId index found, creating a new one');
    }
    
    // Create a new index with partialFilterExpression
    await Order.collection.createIndex(
      { stripeSessionId: 1 },
      {
        unique: true,
        partialFilterExpression: { 
          stripeSessionId: { 
            $type: 'string',
            $exists: true 
          } 
        },
        name: 'stripeSessionId_1'
      }
    );
    
    console.log('Created new stripeSessionId index with partial filtering');
    console.log('Index fix completed successfully');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error fixing stripeSessionId index:', error);
    await mongoose.disconnect().catch(console.error);
    process.exit(1);
  }
}

// Run the function
fixStripeSessionIndex();
