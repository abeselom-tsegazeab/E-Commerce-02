import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AdminLayout from '../components/layout/AdminLayout';

// Lazy load admin pages
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Products = lazy(() => import('../pages/Products'));
const Categories = lazy(() => import('../pages/Categories'));
const Orders = lazy(() => import('../pages/Orders'));
const Customers = lazy(() => import('../pages/Customers'));
const Settings = lazy(() => import('../pages/Settings'));

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
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products/*" element={<Products />} />
          <Route path="categories/*" element={<Categories />} />
          <Route path="orders/*" element={<Orders />} />
          <Route path="customers/*" element={<Customers />} />
          <Route path="settings/*" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </Suspense>
    </AdminLayout>
  );
};

export default AdminRoutes;
