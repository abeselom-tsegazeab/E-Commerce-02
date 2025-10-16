import { useState, useEffect } from 'react';

const NotificationsTab = ({ notifications, setNotifications }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

  const notificationTypes = [
    {
      id: 'email',
      label: 'Email Notifications',
      description: 'Receive email notifications for important updates',
    },
    {
      id: 'push',
      label: 'Push Notifications',
      description: 'Get push notifications on your device',
    },
    {
      id: 'order',
      label: 'Order Updates',
      description: 'Receive updates about your orders',
      parent: 'email',
    },
    {
      id: 'promotional',
      label: 'Promotional Emails',
      description: 'Get updates about new products and offers',
      parent: 'email',
    },
    {
      id: 'security',
      label: 'Security Alerts',
      description: 'Important security notifications about your account',
      parent: 'email',
    },
  ];

  const handleToggle = (id, parentId = null) => {
    if (parentId && !notifications[parentId]) {
      // If parent is disabled, don't allow enabling child
      return;
    }

    setNotifications(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus({ type: '', message: '' });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveStatus({
        type: 'success',
        message: 'Notification preferences saved successfully!'
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveStatus({
        type: 'error',
        message: 'Failed to save preferences. Please try again.'
      });
    } finally {
      setIsSaving(false);
      
      // Clear success/error message after 3 seconds
      if (saveStatus.message) {
        setTimeout(() => {
          setSaveStatus({ type: '', message: '' });
        }, 3000);
      }
    }
  };

  // Initialize notifications state if empty
  useEffect(() => {
    const initialNotifications = {};
    notificationTypes.forEach(type => {
      if (notifications[type.id] === undefined) {
        initialNotifications[type.id] = type.id !== 'promotional'; // Default to true except for promotional
      }
    });
    
    if (Object.keys(initialNotifications).length > 0) {
      setNotifications(prev => ({
        ...prev,
        ...initialNotifications
      }));
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Notification Preferences</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure how you receive notifications.
        </p>
      </div>

      {saveStatus.message && (
        <div 
          className={`p-3 rounded-md ${
            saveStatus.type === 'error' 
              ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
              : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
          }`}
        >
          {saveStatus.message}
        </div>
      )}

      <div className="space-y-6">
        {notificationTypes.map((type) => (
          <div 
            key={type.id} 
            className={`p-4 rounded-lg border ${
              type.parent 
                ? 'ml-8 border-gray-200 dark:border-gray-700' 
                : 'bg-gray-50 dark:bg-gray-800/50 border-transparent'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {type.label}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {type.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle(type.id, type.parent)}
                disabled={type.parent && !notifications[type.parent]}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  notifications[type.id] 
                    ? 'bg-indigo-600' 
                    : 'bg-gray-200 dark:bg-gray-700'
                } ${type.parent && !notifications[type.parent] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                role="switch"
                aria-checked={notifications[type.id] || false}
                aria-labelledby={`${type.id}-label`}
              >
                <span className="sr-only">Toggle {type.label}</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
                    notifications[type.id] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Notification Sounds</h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Play sound for new notifications</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Enable to play a sound when you receive a new notification</p>
          </div>
          <button
            type="button"
            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              notifications.sound ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
            onClick={() => handleToggle('sound')}
          >
            <span className="sr-only">Toggle notification sound</span>
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
                notifications.sound ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsTab;
