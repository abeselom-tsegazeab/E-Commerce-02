import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AdminLayout from '../components/layout/AdminLayout';

// Lazy load admin pages
const Dashboard = lazy(() => import('../pages/Dashboard/index'));
const Products = lazy(() => import('../pages/Products/index'));
const Categories = lazy(() => import('../pages/Categories/index'));
const Orders = lazy(() => import('../pages/Orders/index'));
const Customers = lazy(() => import('../pages/Customers/index'));
const Settings = lazy(() => import('../pages/Settings/index'));

// Main AdminRoutes component that renders the layout and Outlet
const AdminRoutes = () => {
  return (
    <AdminLayout>
      <Suspense 
        fallback={
          <div className="flex items-center justify-center min-h-[50vh]">
            <LoadingSpinner size="xl" />
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </AdminLayout>
  );
};

// Export the route configuration
export const adminRoutes = [
  {
    path: '/',
    element: <AdminRoutes />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'products/*', element: <Products /> },
      { path: 'categories/*', element: <Categories /> },
      { path: 'orders/*', element: <Orders /> },
      { path: 'customers/*', element: <Customers /> },
      { path: 'settings/*', element: <Settings /> },
      { path: '*', element: <Navigate to="dashboard" replace /> },
    ],
  },
];

export default AdminRoutes;