import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { lazy, Suspense } from 'react';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import GuestRoute from './components/auth/GuestRoute';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const AdminRoutes = lazy(() => import('./admin/routes/AdminRoutes'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const PurchaseSuccessPage = lazy(() => import('./pages/PurchaseSuccessPage'));
const PurchaseCancelPage = lazy(() => import('./pages/PurchaseCancelPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const OAuthCallback = lazy(() => import('./pages/auth/OAuthCallback'));

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense 
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <LoadingSpinner size="xl" />
          </div>
        }
      >
        <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          
          {/* Guest-only Routes */}
          <Route 
            path="/login" 
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            } 
          />

          {/* Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchase/success"
            element={
              <ProtectedRoute>
                <PurchaseSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchase/cancel"
            element={
              <ProtectedRoute>
                <PurchaseCancelPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminRoutes />
              </ProtectedRoute>
            }
          />

          {/* 404 - Keep this at the bottom */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

export default AppRoutes;
