import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Logo from '../components/Logo';

const Register = () => {
  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const registrationData = {
        username: formData.owner_name.replace(/\s+/g, '').toLowerCase(),
        email: formData.email,
        password: formData.password,
        first_name: formData.owner_name.split(' ')[0] || '',
        last_name: formData.owner_name.split(' ').slice(1).join(' ') || '',
        phone_number: formData.phone,
        business_name: formData.business_name
      };
      
      const response = await authAPI.register(registrationData);
      localStorage.setItem('access_token', response.data.tokens.access);
      localStorage.setItem('refresh_token', response.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/');
    } catch (error) {
      const errors = error.response?.data;
      if (errors?.email) {
        alert(`Email error: ${errors.email[0]}`);
      } else if (errors?.username) {
        alert(`Username error: ${errors.username[0]}`);
      } else if (errors?.error) {
        alert(errors.error);
      } else {
        alert('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(20px) rotate(-180deg); }
        }
        @keyframes slide-in-left {
          0% { transform: translateX(-100px); opacity: 0; }
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
        .animate-slide-in-left { animation: slide-in-left 0.8s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 1s ease-out; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .animate-expand { animation: expand 1s ease-out; }
        .shadow-3xl { box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25); }
      `}</style>

      {/* Left Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-3 py-2 bg-gray-50 relative overflow-y-auto">
        <div className="max-w-sm w-full transform animate-slide-in-left">
          <div className="text-center mb-3">
            <div className="lg:hidden mb-3">
              <Logo size="large" className="animate-bounce-slow" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1 transform hover:scale-105 transition-transform duration-300">
              Start your free trial
            </h2>
            <p className="text-sm text-gray-600">
              Create your account and get started in minutes
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2 bg-white p-4  shadow-2xl border border-gray-100 transform hover:shadow-3xl transition-all duration-300 backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="transform hover:scale-105 transition-transform duration-200">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Business name
                </label>
                <input
                  type="text"
                  required
                  className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-400 focus:scale-105"
                  placeholder="Your store"
                  value={formData.business_name}
                  onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                />
              </div>
              <div className="transform hover:scale-105 transition-transform duration-200">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Owner name
                </label>
                <input
                  type="text"
                  required
                  className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-400 focus:scale-105"
                  placeholder="Your name"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                />
              </div>
            </div>

            <div className="transform hover:scale-105 transition-transform duration-200">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-400 focus:scale-105"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="transform hover:scale-105 transition-transform duration-200">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  required
                  className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-400 focus:scale-105"
                  placeholder="+234..."
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="transform hover:scale-105 transition-transform duration-200">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-400 focus:scale-105"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 hover:scale-110 transition-transform duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="transform hover:scale-105 transition-transform duration-200">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Address (optional)
              </label>
              <input
                type="text"
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-400 focus:scale-105"
                placeholder="Business location"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <div className="flex items-start">
              <input type="checkbox" required className="mt-1  border-gray-300 text-red-600 focus:ring-red-500 transform hover:scale-110 transition-transform duration-200" />
              <span className="ml-2 text-xs text-gray-600">
                I agree to the{' '}
                <a href="#" className="text-red-600 hover:text-red-500 transform hover:scale-105 transition-transform duration-200 inline-block">Terms</a>
                {' '}and{' '}
                <a href="#" className="text-red-600 hover:text-red-500 transform hover:scale-105 transition-transform duration-200 inline-block">Privacy</a>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2 px-4  font-medium hover:from-red-700 hover:to-red-800 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-xl active:scale-95 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin  h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </div>
              ) : (
                'Start free trial'
              )}
            </button>

            <div className="text-center">
              <span className="text-xs text-gray-600">Already have an account? </span>
              <Link to="/login" className="text-xs text-red-600 hover:text-red-500 font-medium transform hover:scale-105 transition-transform duration-200 inline-block">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-600 via-red-700 to-red-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 flex flex-col justify-center px-6 text-white animate-fade-in-up">
          <div className="mb-6 transform hover:scale-105 transition-transform duration-300">
            <div className="text-white animate-bounce-slow">
              <Logo size="large" className="text-white" />
            </div>
            <div className="w-16 h-1 bg-white  shadow-lg animate-expand"></div>
          </div>
          <h2 className="text-2xl font-light mb-4 leading-tight">
            Everything you need to
            <br />
            <span className="font-semibold">run your business</span>
          </h2>
          <p className="text-lg opacity-90 mb-6 leading-relaxed">
            Join thousands of African businesses already using SupaWave 
            to streamline their operations and boost profits.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start transform hover:translate-x-2 transition-transform duration-200">
              <CheckCircleIcon className="h-5 w-5 text-red-200 mr-3 mt-1 flex-shrink-0 animate-pulse" />
              <div>
                <h3 className="text-base font-semibold mb-1">14-day free trial</h3>
                <p className="text-sm text-red-100">No credit card required, cancel anytime</p>
              </div>
            </div>
            <div className="flex items-start transform hover:translate-x-2 transition-transform duration-200">
              <CheckCircleIcon className="h-5 w-5 text-red-200 mr-3 mt-1 flex-shrink-0 animate-pulse" />
              <div>
                <h3 className="text-base font-semibold mb-1">Complete POS system</h3>
                <p className="text-sm text-red-100">Process sales, manage inventory, track customers</p>
              </div>
            </div>
            <div className="flex items-start transform hover:translate-x-2 transition-transform duration-200">
              <CheckCircleIcon className="h-5 w-5 text-red-200 mr-3 mt-1 flex-shrink-0 animate-pulse" />
              <div>
                <h3 className="text-base font-semibold mb-1">Works offline</h3>
                <p className="text-sm text-red-100">Keep selling even without internet connection</p>
              </div>
            </div>
            <div className="flex items-start transform hover:translate-x-2 transition-transform duration-200">
              <CheckCircleIcon className="h-5 w-5 text-red-200 mr-3 mt-1 flex-shrink-0 animate-pulse" />
              <div>
                <h3 className="text-base font-semibold mb-1">Mobile optimized</h3>
                <p className="text-sm text-red-100">Use on any device - phone, tablet, or computer</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white bg-opacity-10  backdrop-blur-sm transform hover:scale-105 transition-transform duration-300">
            <p className="text-sm text-red-100 mb-2">Trusted by 10,000+ businesses</p>
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-300 text-base animate-pulse" style={{animationDelay: `${i * 0.2}s`}}>★</span>
              ))}
              <span className="ml-2 text-white font-medium text-sm">4.9/5 rating</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white opacity-5  transform translate-x-32 translate-y-32 animate-float"></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-5  transform -translate-x-16 -translate-y-16 animate-float-reverse"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white opacity-10  animate-ping"></div>
      </div>
      
    </div>
  );
};

export default Register;
