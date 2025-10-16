import { useState, useEffect } from 'react';
import { FiGlobe, FiMoon, FiSun, FiSave } from 'react-icons/fi';

const PreferencesTab = ({ darkMode, setDarkMode }) => {
  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    darkMode: darkMode,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

  const languages = [
    { value: 'en', label: 'English (US)' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'zh', label: '中文' },
    { value: 'ja', label: '日本語' },
  ];

  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKST)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  ];

  const dateFormats = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
    { value: 'DD MMM YYYY', label: 'DD MMM YYYY' },
  ];

  const timeFormats = [
    { value: '12h', label: '12-hour (2:30 PM)' },
    { value: '24h', label: '24-hour (14:30)' },
  ];

  useEffect(() => {
    // Load saved preferences from localStorage or API
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(prev => ({
          ...prev,
          ...parsed,
          darkMode: darkMode // Always use the current darkMode from props
        }));
      } catch (error) {
        console.error('Error parsing saved preferences:', error);
      }
    }
  }, [darkMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus({ type: '', message: '' });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage (in a real app, this would be an API call)
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      
      // Update dark mode in the parent component
      setDarkMode(preferences.darkMode);
      
      setSaveStatus({
        type: 'success',
        message: 'Preferences saved successfully!'
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
      setTimeout(() => {
        setSaveStatus({ type: '', message: '' });
      }, 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Preferences</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Customize your application preferences.
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Language */}
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Language
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiGlobe className="h-4 w-4 text-gray-400" />
              </div>
              <select
                id="language"
                name="language"
                value={preferences.language}
                onChange={handleChange}
                className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Timezone
            </label>
            <select
              id="timezone"
              name="timezone"
              value={preferences.timezone}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {timezones.map((zone) => (
                <option key={zone.value} value={zone.value}>
                  {zone.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Format */}
          <div>
            <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date Format
            </label>
            <select
              id="dateFormat"
              name="dateFormat"
              value={preferences.dateFormat}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {dateFormats.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label} ({new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })})
                </option>
              ))}
            </select>
          </div>

          {/* Time Format */}
          <div>
            <label htmlFor="timeFormat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time Format
            </label>
            <select
              id="timeFormat"
              name="timeFormat"
              value={preferences.timeFormat}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {timeFormats.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Theme Preferences */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">Display Preferences</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Switch between light and dark theme
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newDarkMode = !preferences.darkMode;
                  setPreferences(prev => ({
                    ...prev,
                    darkMode: newDarkMode
                  }));
                }}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  preferences.darkMode ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={preferences.darkMode}
              >
                <span className="sr-only">Toggle dark mode</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
                    preferences.darkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                >
                  {preferences.darkMode ? (
                    <FiMoon className="h-3 w-3 m-1 text-indigo-600" />
                  ) : (
                    <FiSun className="h-3 w-3 m-1 text-yellow-500" />
                  )}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">High Contrast Mode</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Increase contrast for better visibility
                </p>
              </div>
              <button
                type="button"
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  preferences.highContrast ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
                onClick={() => {
                  setPreferences(prev => ({
                    ...prev,
                    highContrast: !prev.highContrast
                  }));
                }}
                role="switch"
                aria-checked={preferences.highContrast || false}
              >
                <span className="sr-only">Toggle high contrast mode</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
                    preferences.highContrast ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Reduced Motion</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Disable animations and transitions
                </p>
              </div>
              <button
                type="button"
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  preferences.reducedMotion ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
                onClick={() => {
                  setPreferences(prev => ({
                    ...prev,
                    reducedMotion: !prev.reducedMotion
                  }));
                }}
                role="switch"
                aria-checked={preferences.reducedMotion || false}
              >
                <span className="sr-only">Toggle reduced motion</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
                    preferences.reducedMotion ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            <FiSave className="-ml-1 mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PreferencesTab;
