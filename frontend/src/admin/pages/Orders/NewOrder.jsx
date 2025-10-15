// frontend/src/admin/pages/Orders/NewOrder.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderForm from '../../components/orders/OrderForm';

const NewOrder = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  
  const handleSubmit = async (orderData) => {
    setIsSubmitting(true);
    try {
      // In a real app, you would make an API call here
      console.log('Creating new order:', orderData);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Navigate back to orders page after successful submission
      navigate('/admin/orders', { state: { newOrder: orderData } });
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Create New Order
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Fill in the order details below
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <OrderForm 
            onClose={() => navigate('/admin/orders')} 
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default NewOrder;