import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import RegisterForm from '../../components/auth/RegisterForm';

const RegisterPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 py-16 sm:py-24">
      <div className="w-full max-w-md mx-auto">
        <RegisterForm redirectTo={from} />
      </div>
    </div>
  );
};

export default RegisterPage;
