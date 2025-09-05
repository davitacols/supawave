import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      localStorage.setItem('access_token', response.data.tokens.access);
      localStorage.setItem('refresh_token', response.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/');
    } catch (error) {
      alert('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(20px) rotate(-180deg); }
        }
        @keyframes slide-in-right {
          0% { transform: translateX(100px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes fade-in-up {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes expand {
          0% { width: 0; }
          100% { width: 5rem; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 8s ease-in-out infinite; }
        .animate-slide-in-right { animation: slide-in-right 0.8s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 1s ease-out; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .animate-expand { animation: expand 1s ease-out; }
        .shadow-3xl { box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25); }
      `}</style>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 flex flex-col justify-center px-8 text-white animate-fade-in-up">
          <div className="mb-8 transform hover:scale-105 transition-transform duration-300">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-sky-100 bg-clip-text text-transparent animate-bounce-slow">SupaWave</h1>
            <div className="w-20 h-1 bg-white  shadow-lg animate-expand"></div>
          </div>
          <h2 className="text-3xl font-light mb-6 leading-tight">
            Inventory Management
            <br />
            <span className="font-semibold">Made Simple</span>
          </h2>
          <p className="text-xl opacity-90 mb-8 leading-relaxed">
            Streamline your business operations with our powerful, 
            easy-to-use inventory management system designed for African businesses.
          </p>
          <div className="space-y-4">
            <div className="flex items-center transform hover:translate-x-2 transition-transform duration-200">
              <div className="w-2 h-2 bg-white  mr-4 animate-pulse shadow-lg"></div>
              <span className="text-lg">Real-time inventory tracking</span>
            </div>
            <div className="flex items-center transform hover:translate-x-2 transition-transform duration-200">
              <div className="w-2 h-2 bg-white  mr-4 animate-pulse shadow-lg"></div>
              <span className="text-lg">Smart sales analytics</span>
            </div>
            <div className="flex items-center transform hover:translate-x-2 transition-transform duration-200">
              <div className="w-2 h-2 bg-white  mr-4 animate-pulse shadow-lg"></div>
              <span className="text-lg">Mobile-first design</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white opacity-5  transform translate-x-32 translate-y-32 animate-float"></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-5  transform -translate-x-16 -translate-y-16 animate-float-reverse"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white opacity-10  animate-ping"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-4 bg-gray-50 relative overflow-y-auto">
        <div className="max-w-md w-full transform animate-slide-in-right my-4">
          <div className="text-center mb-6">
            <div className="lg:hidden mb-6">
              <h1 className="text-3xl font-bold text-sky-600 animate-bounce-slow">SupaWave</h1>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 transform hover:scale-105 transition-transform duration-300">
              Welcome back
            </h2>
            <p className="text-gray-600">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 -2xl shadow-2xl border border-gray-100 transform hover:shadow-3xl transition-all duration-300 backdrop-blur-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 border border-gray-300  focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 transform focus:scale-105 hover:shadow-lg bg-gradient-to-r from-white to-gray-50"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300  focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 transform focus:scale-105 hover:shadow-lg bg-gradient-to-r from-white to-gray-50"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 hover:scale-110 transition-transform duration-200"
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
              <label className="flex items-center">
                <input type="checkbox" className=" border-gray-300 text-sky-600 focus:ring-sky-500" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-sky-600 hover:text-sky-500 transform hover:scale-105 transition-transform duration-200">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-sky-500 to-sky-600 text-white py-3 px-4  font-medium hover:from-sky-600 hover:to-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-xl active:scale-95 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin  h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>

            <div className="text-center">
              <span className="text-gray-600">Don't have an account? </span>
              <Link to="/register" className="text-sky-600 hover:text-sky-500 font-medium transform hover:scale-105 transition-transform duration-200 inline-block">
                Sign up for free
              </Link>
            </div>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              By signing in, you agree to our{' '}
              <a href="#" className="text-sky-600 hover:text-sky-500">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-sky-600 hover:text-sky-500">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
