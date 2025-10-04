import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import ForgotPassword from '../components/ForgotPassword';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { login, error } = useAuth();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await login(formData);
    
    if (!result.success) {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className={`max-w-md w-full space-y-8 relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Header */}
        <div className="text-center">
              <Link 
                to="/" 
                className="inline-block mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-sm transform hover:scale-110 transition-transform duration-300 animate-pulse hover:shadow-md"
              >
                <span className="text-white font-bold text-2xl">E</span>
              </Link>
              <h2 className="mt-6 text-3xl font-bold text-gray-900 animate-fade-in">
                Welcome Back
              </h2>
              <p className="mt-2 text-sm text-gray-600 animate-fade-in animation-delay-200">
                Sign in to your expense management account
              </p>
              <Link 
                to="/" 
                className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-500 font-medium transition-all duration-200 hover:underline animate-fade-in animation-delay-300"
              >
                ← Back to Home
              </Link>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-sm py-8 px-6 shadow-sm rounded-2xl border border-gray-100 transform hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center animate-shake">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                {error}
              </div>
            )}

            <div className="animate-fade-in animation-delay-300">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="form-input"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="animate-fade-in animation-delay-400">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="form-input pr-12"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between animate-fade-in animation-delay-500">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-all duration-200 hover:underline"
              >
                Forgot your password?
              </button>
            </div>

            <button
              type="submit"
              className="btn-primary w-full flex justify-center items-center animate-fade-in animation-delay-600"
            >
              Sign In
              <ArrowRightIcon className="ml-2 h-4 w-4 animate-bounce" />
            </button>
          </form>

          <div className="mt-6 animate-fade-in animation-delay-700">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to ExpenseTracker?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/register"
                className="btn-outline w-full flex justify-center"
              >
                Create your company account
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <ForgotPassword onClose={() => setShowForgotPassword(false)} />
      )}
    </div>
  );
};

export default Login;
