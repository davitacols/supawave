import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Logo from '../components/Logo';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData);
      localStorage.setItem('access_token', response.data.tokens.access);
      localStorage.setItem('refresh_token', response.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/');
    } catch (error) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes slideIn {
          0% { transform: translateX(-100px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-slide-in { animation: slideIn 0.8s ease-out; }
        .animate-fade-in-up { animation: fadeInUp 1s ease-out; }
      `}</style>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800"></div>
        <div className="relative z-10 flex flex-col justify-between h-full px-12 py-12 text-white animate-slide-in">
          <div>
            <div className="mb-12">
              <div className="text-white transform hover:scale-105 transition-transform duration-300">
                <Logo size="large" />
              </div>
              <div className="w-16 h-1 bg-white/80 rounded-full mt-4 animate-expand"></div>
            </div>
            <h2 className="text-3xl font-light mb-8 transform hover:translate-x-2 transition-transform duration-200">
              Modern Inventory
              <br />
              <span className="font-semibold">Management</span>
            </h2>
            <p className="text-xl text-white/90 mb-12 transform hover:translate-x-2 transition-transform duration-200">
              Streamline your business operations with intelligent tracking and analytics.
            </p>
          </div>
          
          <div className="space-y-6">
            {[
              'Real-time inventory tracking',
              'Smart sales analytics',
              'Mobile-optimized interface'
            ].map((feature, index) => (
              <div key={index} className="flex items-center group transform hover:translate-x-2 transition-transform duration-200">
                <div className="w-2 h-2 bg-white rounded-full mr-4 group-hover:scale-125 transition-transform"></div>
                <span className="text-lg">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-32 translate-y-32 animate-float"></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full transform -translate-x-16 -translate-y-16 animate-float" style={{animationDelay: '2s'}}></div>
        

      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Logo size="large" />
          </div>
          
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-600">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Form */}
          <div className="bg-white p-8 rounded-lg shadow-2xl border border-gray-100 transform hover:shadow-3xl transition-all duration-300 animate-fade-in-up">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg transform hover:scale-105 transition-transform duration-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <div className="transform hover:scale-105 transition-transform duration-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-400 focus:scale-105"
                  required
                />
              </div>

              <div className="transform hover:scale-105 transition-transform duration-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-400 focus:scale-105"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 hover:scale-110 transition-transform duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center group cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 transform hover:scale-110 transition-transform duration-200" 
                  />
                  <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-200">Remember me</span>
                </label>
                <Link 
                  to="#" 
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium transform hover:scale-105 transition-transform duration-200 inline-block"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <span className="text-gray-600">Don't have an account? </span>
              <Link 
                to="/register" 
                className="text-blue-600 hover:text-blue-500 font-medium transform hover:scale-105 transition-transform duration-200 inline-block"
              >
                Sign up for free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
