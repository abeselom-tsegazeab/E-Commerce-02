const { broadcastNotification } = require('./server');

// Simulate admin events
const simulateAdminEvents = () => {
  const adminEvents = [
    {
      title: 'New Order',
      message: 'New order #' + Math.floor(1000 + Math.random() * 9000) + ' has been placed',
      type: 'order',
      priority: 'high',
      link: '/admin/orders'
    },
    {
      title: 'New User Registration',
      message: 'A new user has registered',
      type: 'user',
      priority: 'medium',
      link: '/admin/users'
    },
    {
      title: 'Low Stock Alert',
      message: 'Product "Premium Headphones" is running low on stock',
      type: 'inventory',
      priority: 'high',
      link: '/admin/inventory'
    },
    {
      title: 'New Review',
      message: 'A new product review is awaiting moderation',
      type: 'review',
      priority: 'low',
      link: '/admin/reviews'
    }
  ];

  // Send a random admin event every 1-3 minutes
  const randomTime = Math.floor(Math.random() * 120000) + 60000;
  
  setTimeout(() => {
    const randomEvent = adminEvents[Math.floor(Math.random() * adminEvents.length)];
    broadcastNotification({
      ...randomEvent,
      timestamp: new Date().toISOString(),
      isAdmin: true
    });
    
    // Schedule next event
    simulateAdminEvents();
  }, randomTime);
};

module.exports = { simulateAdminEvents };
