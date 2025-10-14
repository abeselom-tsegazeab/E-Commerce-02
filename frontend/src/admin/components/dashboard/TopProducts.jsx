import { useState, useEffect } from 'react';
import { FiStar, FiShoppingBag, FiArrowRight, FiTag, FiAlertCircle, FiZap, FiClock, FiWifi, FiWifiOff } from 'react-icons/fi';
import { motion } from 'framer-motion';

// Mock WebSocket service for demonstration
const useWebSocket = (url) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Simulate WebSocket connection
    const connect = () => {
      console.log('Connecting to WebSocket...');
      setTimeout(() => {
        console.log('WebSocket connected');
        setIsConnected(true);
      }, 1000);
    };

    connect();

    // Simulate connection status changes
    const connectionInterval = setInterval(() => {
      if (Math.random() > 0.9) { // 10% chance of disconnection
        setIsConnected(false);
        setTimeout(() => {
          if (Math.random() > 0.3) { // 70% chance of reconnection
            connect();
          }
        }, 2000);
      }
    }, 10000);

    return () => {
      clearInterval(connectionInterval);
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };
  }, []);

  // Simulate receiving updates
  const simulateUpdate = (updateCallback) => {
    if (!isConnected) return () => {};

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      updateCallback();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  };

  return { isConnected, lastUpdate, simulateUpdate };
};

// Animated counter component
const AnimatedCounter = ({ value, className = '' }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setDisplayValue(value);
    setKey(prev => prev + 1);
  }, [value]);

  return (
    <motion.span 
      key={key}
      initial={{ y: -5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 5, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {displayValue.toLocaleString()}
    </motion.span>
  );
};

const TopProducts = () => {
  // Initial products data
  const initialProducts = [
    {
      id: 1,
      name: 'Wireless Headphones',
      category: 'Electronics',
      price: 99.99,
      originalPrice: 129.99,
      sales: 1245,
      stock: 15,
      rating: 4.8,
      addedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&h=80&fit=crop&crop=faces',
      color: 'from-blue-500 to-cyan-400'
    },
    // ... other products
  ];

  const [products, setProducts] = useState(initialProducts);
  const { isConnected, lastUpdate, simulateUpdate } = useWebSocket('ws://your-websocket-url');

  // Simulate real-time updates
  useEffect(() => {
    if (!isConnected) return;

    const updateProducts = () => {
      setProducts(currentProducts => 
        currentProducts.map(product => {
          // Random changes to simulate real-time updates
          const salesChange = Math.floor(Math.random() * 3);
          const stockChange = Math.random() > 0.9 ? -1 : 0;
          const newStock = Math.max(0, product.stock + stockChange);
          const isOutOfStock = newStock === 0;
          
          return {
            ...product,
            sales: product.sales + (isOutOfStock ? 0 : salesChange), // Don't increase sales if out of stock
            stock: newStock,
            lastUpdated: new Date().toISOString()
          };
        })
      );
    };

    // Start the simulation
    const cleanup = simulateUpdate(updateProducts);
    return cleanup;
  }, [isConnected, simulateUpdate]);

  // Status badge component
  const StatusBadge = ({ type, value }) => {
    const baseStyles = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
    
    const badgeConfig = {
      bestseller: {
        text: "Bestseller",
        icon: <FiZap className="mr-1 h-3 w-3" />,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      },
      lowStock: {
        text: `Low Stock (${value})`,
        icon: <FiAlertCircle className="mr-1 h-3 w-3" />,
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      },
      newArrival: {
        text: "New",
        icon: <FiClock className="mr-1 h-3 w-3" />,
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      },
      onSale: {
        text: `Sale ${value}%`,
        icon: <FiTag className="mr-1 h-3 w-3" />,
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      }
    };

    const { text, icon, className } = badgeConfig[type] || {};

    return (
      <motion.span 
        className={`${baseStyles} ${className}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {icon}
        {text}
      </motion.span>
    );
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  const isNewProduct = (dateString) => {
    const addedDate = new Date(dateString);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return addedDate > weekAgo;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700/50 relative"
    >
      {/* Connection status bar */}
      <div className={`px-4 py-2 text-xs flex items-center justify-between ${
        isConnected 
          ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
          : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
      }`}>
        <div className="flex items-center">
          {isConnected ? (
            <FiWifi className="h-3.5 w-3.5 mr-1.5" />
          ) : (
            <FiWifiOff className="h-3.5 w-3.5 mr-1.5" />
          )}
          <span>{isConnected ? 'Live updates active' : 'Reconnecting...'}</span>
        </div>
        <span className="text-xs opacity-75">
          Updated: {lastUpdate.toLocaleTimeString()}
        </span>
      </div>

      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Top Selling</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time product performance</p>
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
            <FiArrowRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="divide-y divide-gray-100 dark:divide-gray-700/50"
      >
        {products.map((product) => {
          const isBestseller = product.sales > 1000;
          const isLowStock = product.stock < 10 && product.stock > 0;
          const isOutOfStock = product.stock === 0;
          const isNew = isNewProduct(product.addedDate);
          const discount = product.originalPrice 
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : 0;
          const isOnSale = discount > 0;

          return (
            <motion.div 
              key={product.id} 
              variants={item}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="px-6 py-4 group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200"
            >
              <div className="flex items-center space-x-4">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${product.color} flex-shrink-0 overflow-hidden ${
                  isOutOfStock ? 'opacity-50' : ''
                }`}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover mix-blend-multiply"
                  />
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 rotate-[-15deg]">SOLD OUT</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${
                      isOutOfStock 
                        ? 'text-gray-400 dark:text-gray-500' 
                        : 'text-gray-900 dark:text-white'
                    } truncate pr-2`}>
                      {product.name}
                    </h4>
                    <div className="flex items-center space-x-1">
                      {isBestseller && <StatusBadge type="bestseller" />}
                      {isLowStock && <StatusBadge type="lowStock" value={product.stock} />}
                      {isNew && <StatusBadge type="newArrival" />}
                      {isOnSale && <StatusBadge type="onSale" value={discount} />}
                    </div>
                  </div>
                  
                  <div className="mt-1 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center text-amber-400">
                        <FiStar className="h-3.5 w-3.5 fill-current" />
                        <span className="ml-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                          {product.rating}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <FiShoppingBag className="h-3 w-3 mr-1" />
                        <span className="text-xs">
                          <AnimatedCounter value={product.sales} />
                        </span>
                      </div>
                      {product.stock > 0 && (
                        <>
                          <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <AnimatedCounter value={product.stock} /> in stock
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center">
                      {product.originalPrice && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 line-through mr-2">
                          ${product.originalPrice.toFixed(2)}
                        </span>
                      )}
                      <span className={`text-sm font-medium ${
                        isOutOfStock 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        ${product.price.toFixed(2)}
                        {isOutOfStock && (
                          <span className="ml-1 text-xs text-red-500 dark:text-red-400">(Out of stock)</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30 border-t border-gray-100 dark:border-gray-700/50">
        <button className="w-full group flex items-center justify-center text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">
          View all products
          <FiArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </motion.div>
  );
};

export default TopProducts;