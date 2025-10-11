import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * GuestRoute Component
 * 
 * A wrapper component that only allows non-authenticated users to access the wrapped routes.
 * If a user is already authenticated, they will be redirected to the home page.
 * Shows a loading spinner while checking authentication status.
 */
const GuestRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // If user is authenticated, redirect to home page or intended destination
  if (isAuthenticated) {
    // Get the intended destination from location state or default to home
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace state={{ from: location }} />;
  }

  // If not authenticated, render the child components (login/signup pages)
  return children;
};

export default GuestRoute;
