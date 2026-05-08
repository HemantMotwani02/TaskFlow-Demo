import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToastContext } from '../../contexts/ToastContext';
import axios from 'axios';
import { 
  EnvelopeIcon, 
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToastContext();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      showError('Please enter your email address', 'Validation Error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address', 'Validation Error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:7007'}/api/auth/forgot-password`,
        { email }
      );

      if (response.data.success) {
        showSuccess('OTP sent to your email', 'Success');
        // Navigate to verify OTP page with email
        navigate('/verify-otp', { state: { email } });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      showError(errorMessage, 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      backgroundAttachment: 'fixed'
    }}>
      <div className="max-w-md w-full auth-form-container">
        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 auth-form-card" style={{ 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          background: 'rgba(255, 255, 255, 1)'
        }}>
          {/* Header inside form */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full shadow-lg mb-4">
              <EnvelopeIcon className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Forgot Password?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              No worries! Enter your email and we'll send you a verification code.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2 dark:text-gray-100">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 placeholder-gray-500 bg-white text-gray-900"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    We'll send a 6-digit verification code to your email that expires in 10 minutes.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl py-3 px-4 text-sm font-semibold hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Sending OTP...
                </>
              ) : (
                <>
                  Send Verification Code
                  <EnvelopeIcon className="h-4 w-4 ml-2" />
                </>
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </form>
        </div>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <p className="text-sm font-medium" style={{ 
            color: '#000000', 
            fontWeight: '700',
            textShadow: '2px 2px 4px rgba(255, 255, 255, 0.9)',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: '8px 16px',
            borderRadius: '8px',
            display: 'inline-block'
          }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-200"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

