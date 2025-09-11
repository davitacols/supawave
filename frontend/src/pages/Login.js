import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import Logo from '../components/Logo';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon, ChartBarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData);
      
      // Store tokens and user data
      localStorage.setItem('access_token', response.data.tokens.access);
      localStorage.setItem('refresh_token', response.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to dashboard
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex flex-col justify-between h-full px-12 py-16 text-white">
            <div>
              <div className="mb-12">
                <Logo size="large" className="text-white" />
              </div>
              <h1 className="text-5xl font-bold mb-8 leading-tight">
                <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  The Ultimate
                </span>
                <br />
                <span className="text-white">Business Platform</span>
                <br />
                <span className="text-2xl font-normal text-gray-300">for African Entrepreneurs</span>
              </h1>
              <p className="text-xl text-gray-300 mb-12 leading-relaxed max-w-lg">
                Transform your business with AI-powered inventory management, real-time analytics, and seamless WhatsApp integration. Built specifically for African SMEs.
              </p>

          </div>
        </div>
          
          {/* Enhanced decorative elements */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-32 w-20 h-20 bg-gradient-to-br from-blue-300/30 to-transparent rounded-full blur-lg animate-bounce"></div>
          <div className="absolute top-1/2 right-10 w-16 h-16 bg-gradient-to-br from-purple-300/40 to-transparent rounded-full blur-md animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/3 left-10 w-24 h-24 bg-gradient-to-br from-yellow-300/20 to-transparent rounded-full blur-lg animate-bounce" style={{animationDelay: '2s'}}></div>
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
              backgroundSize: '50px 50px'
            }}></div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center">
              <Logo size="large" />
            </div>
            
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back
              </h2>
              <p className="text-gray-600">
                Sign in to your SupaWave account
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in to Dashboard'
                )}
              </button>

              <div className="text-center">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Start your free trial
                  </Link>
                </p>
              </div>
            </form>

            {/* Demo Credentials */}
            <div className="bg-gray-50 rounded-lg p-4 mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Demo Account:</h4>
              <p className="text-xs text-gray-600">
                Email: <span className="font-mono bg-white px-1 rounded">pic2nav@gmail.com</span>
                <br />
                Password: <span className="font-mono bg-white px-1 rounded">password123</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;