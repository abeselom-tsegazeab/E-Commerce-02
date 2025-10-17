import { useState } from 'react';
import { FiCreditCard, FiPlus, FiCheck, FiX, FiZap } from 'react-icons/fi';

const BillingTab = () => {
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, last4: '4242', brand: 'Visa', exp_month: '12', exp_year: '25', isDefault: true },
    { id: 2, last4: '1881', brand: 'Mastercard', exp_month: '06', exp_year: '24', isDefault: false },
  ]);

  const [showAddCard, setShowAddCard] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleSetDefault = (id) => {
    setPaymentMethods(prev => 
      prev.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
    
    // Simulate API call
    setIsProcessing(true);
    setTimeout(() => {
      setStatus({
        type: 'success',
        message: 'Default payment method updated successfully!'
      });
      setIsProcessing(false);
    }, 1000);
  };

  const handleRemoveCard = (id) => {
    if (paymentMethods.some(m => m.id === id && m.isDefault)) {
      setStatus({
        type: 'error',
        message: 'Cannot remove default payment method. Please set another card as default first.'
      });
      return;
    }
    
    setPaymentMethods(prev => prev.filter(method => method.id !== id));
    
    // Simulate API call
    setIsProcessing(true);
    setTimeout(() => {
      setStatus({
        type: 'success',
        message: 'Payment method removed successfully!'
      });
      setIsProcessing(false);
    }, 1000);
  };

  const handleAddCard = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      const newCard = {
        id: Date.now(),
        last4: Math.floor(1000 + Math.random() * 9000),
        brand: 'Visa',
        exp_month: '12',
        exp_year: '27',
        isDefault: paymentMethods.length === 0
      };
      
      setPaymentMethods(prev => [...prev, newCard]);
      setShowAddCard(false);
      setStatus({
        type: 'success',
        message: 'Payment method added successfully!'
      });
      setIsProcessing(false);
    }, 1500);
  };

  const getCardIcon = (brand) => {
    const brandIcons = {
      'visa': 'VISA',
      'mastercard': 'MC',
      'amex': 'AMEX',
      'discover': 'DISCOVER',
      'jcb': 'JCB',
      'diners': 'DINERS',
    };
    
    return brandIcons[brand.toLowerCase()] || 'CARD';
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Billing & Subscription</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your subscription and payment methods.
        </p>
      </div>

      {status.message && (
        <div 
          className={`p-3 rounded-md ${
            status.type === 'error' 
              ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
              : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Current Plan</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                You're currently on the <span className="font-medium text-indigo-600 dark:text-indigo-400">Pro Plan</span>.
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Next billing date: <span className="font-medium">January 15, 2024</span>
              </p>
            </div>
            <div className="mt-4 sm:mt-0
            ">
              <button
                type="button"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-800/50 transition-colors"
              >
                Change Plan
              </button>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Plan Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                'Unlimited products',
                'Advanced analytics',
                'Priority support',
                'Custom domain',
                'API access',
                'Team members',
              ].map((feature) => (
                <div key={feature} className="flex items-start">
                  <FiCheck className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Payment Methods</h3>
          <button
            type="button"
            onClick={() => setShowAddCard(!showAddCard)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-800/50 transition-colors"
          >
            <FiPlus className="mr-1.5 h-4 w-4" />
            Add Payment Method
          </button>
        </div>
        
        {showAddCard && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label htmlFor="card-number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  id="card-number"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0000 0000 0000 0000"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    id="expiry"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="MM/YY"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="cvc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CVC
                  </label>
                  <input
                    type="text"
                    id="cvc"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="CVC"
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCard(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Adding...' : 'Add Card'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {paymentMethods.length > 0 ? (
            paymentMethods.map((method) => (
              <div key={method.id} className="p-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-16 flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium text-sm mr-4">
                      {getCardIcon(method.brand)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {method.brand} ending in {method.last4}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Expires {method.exp_month}/{method.exp_year}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {method.isDefault ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        Default
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(method.id)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                        disabled={isProcessing}
                      >
                        Set as default
                      </button>
                    )}
                    
                    {!method.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCard(method.id)}
                        className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        disabled={isProcessing}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <FiCreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No payment methods</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by adding a payment method.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddCard(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                  Add Payment Method
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Billing History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Billing History</h3>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {[
            { id: 1, date: '2023-12-15', description: 'Pro Plan Subscription', amount: 29.00, status: 'Paid' },
            { id: 2, date: '2023-11-15', description: 'Pro Plan Subscription', amount: 29.00, status: 'Paid' },
            { id: 3, date: '2023-10-15', description: 'Pro Plan Subscription', amount: 29.00, status: 'Paid' },
          ].map((invoice) => (
            <div key={invoice.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <FiCreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {invoice.description}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    ${invoice.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {invoice.status}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 text-center">
            <button
              type="button"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
            >
              View full billing history
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingTab;
