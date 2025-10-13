import { ToastContainer } from 'react-toastify';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { ErrorBoundary } from 'react-error-boundary';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/common/Footer';
import AppRoutes from './AppRoutes';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Initialize API configuration
import './utils/axiosConfig';

// Custom hook to check if current route is an admin route
const useIsAdminRoute = () => {
  const location = useLocation();
  return location.pathname.startsWith('/admin');
};

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="max-w-md p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-bold text-red-600 dark:text-red-400">
          Something went wrong
        </h2>
        <pre className="p-4 mb-6 overflow-auto text-sm text-left text-gray-700 bg-gray-100 rounded-md dark:bg-gray-700 dark:text-gray-300">
          {error.message}
        </pre>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Reload Page
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

// Main app layout for non-admin routes
const MainApp = () => (
  <div className="flex flex-col min-h-screen bg-gray-50">
    <Navbar />
    <main className="flex-grow">
      <AppRoutes />
    </main>
    <Footer />
    <ToastContainer 
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      style={{ marginTop: '4.5rem' }}
      toastStyle={{
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
    />
  </div>
);

// Admin app layout with theme provider
const AdminApp = () => {
  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        <AppRoutes />
        <ToastContainer 
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          style={{ marginTop: '4.5rem' }}
          toastStyle={{
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}
        />
      </div>
    </ThemeProvider>
  );
};

const AppContent = () => {
  // Ensure light mode for main app
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const isAdminRoute = useIsAdminRoute();
  return isAdminRoute ? <AdminApp /> : <MainApp />;
};

const App = () => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset the state of your app so the error doesn't happen again
      }}
      onError={(error, errorInfo) => {
        console.error('Error caught by error boundary:', error, errorInfo);
      }}
    >
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;