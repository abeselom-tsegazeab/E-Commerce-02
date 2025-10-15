import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AdminLayout from '../components/layout/AdminLayout';
// Add these routes to your existing routes



// Lazy load admin pages
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Products = lazy(() => import('../pages/Products'));
const ProductFormPage = lazy(() => import('../pages/Products/ProductFormPage'));
const Categories = lazy(() => import('../pages/Categories'));
const CreateCategory = lazy(() => import('../pages/Categories/CreateCategory'))
const Orders = lazy(() => import('../pages/Orders'));
const NewOrder = lazy(() => import('../pages/Orders/NewOrder'));
const Customers = lazy(() => import('../pages/Customers'));
const Settings = lazy(() => import('../pages/Settings'));
const Analytics = lazy(() => import('../pages/Analytics'));
const Notifications = lazy(() => import('../pages/Notifications'));

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
      { path: 'products', element: <Products /> },
      { path: 'products/new', element: <ProductFormPage /> },
      { path: 'products/edit/:id', element: <ProductFormPage /> },
      { path: 'categories', element: <Categories /> },
      { path: 'categories/new', element: <CreateCategory /> },
      { path: 'categories/edit/:id', element: <CreateCategory /> },
      { path: 'orders/*', element: <Orders /> },
      { path: 'orders/new', element: <NewOrder /> },
      { path: 'customers/*', element: <Customers /> },
      { path: 'settings/*', element: <Settings /> },
      { path: 'analytics/*', element: <Analytics /> },
      { path: 'notifications/*', element: <Notifications /> },
      { path: '*', element: <Navigate to="dashboard" replace /> },
    ],
  },
];

export default AdminRoutes;