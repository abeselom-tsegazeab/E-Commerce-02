import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useEffect } from 'react';

/**
 * ProtectedRoute Component
 * 
 * A wrapper component that protects routes from unauthorized access.
 * - Shows loading state while checking authentication
 * - Redirects to login if user is not authenticated
 * - Validates user roles and admin access if required
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to render if authenticated
 * @param {Array} [props.roles=[]] - Array of allowed roles (empty array means any authenticated user)
 * @param {boolean} [props.adminOnly=false] - If true, only allows admin users
 * @returns {ReactNode} Protected route or redirect
 */
const ProtectedRoute = ({ children, roles = [], adminOnly = false }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.roles?.includes('admin');

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" text="Authenticating..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    // Store the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin access if required
  if (adminOnly && !isAdmin) {
    return (
      <Navigate 
        to="/" 
        state={{ 
          from: location,
          error: "Admin privileges required to access this page"
        }} 
        replace 
      />
    );
  }

  // Check if route is role-protected and user has required role
  const userRoles = user.roles || (user.role ? [user.role] : []);
  if (roles.length > 0 && !roles.some(role => userRoles.includes(role))) {
    return (
      <Navigate 
        to="/" 
        state={{ 
          from: location,
          error: "You don't have permission to access this page"
        }} 
        replace 
      />
    );
  }

  // If authenticated and authorized, render the children
  return (
    <>
      {children}
      {/* Add any common layout or wrapper components here */}
    </>
  );
};

export default ProtectedRoute;