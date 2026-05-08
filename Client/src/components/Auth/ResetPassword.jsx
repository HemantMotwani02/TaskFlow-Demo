import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useToastContext } from '../../contexts/ToastContext';
import axios from 'axios';
import { 
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showError, showSuccess } = useToastContext();
  
  const email = location.state?.email;
  const otp_code = location.state?.otp_code;

  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });

  // Redirect if no email or OTP provided
  useEffect(() => {
    if (!email || !otp_code) {
      showError('Invalid access. Please start from forgot password.', 'Error');
      navigate('/forgot-password');
    }
  }, [email, otp_code, navigate, showError]);

  // Password strength checker
  useEffect(() => {
    const password = formData.new_password;
    if (!password) {
      setPasswordStrength({ score: 0, text: '', color: '' });
      return;
    }

    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const strengths = [
      { score: 1, text: 'Weak', color: 'text-red-600' },
      { score: 2, text: 'Fair', color: 'text-orange-600' },
      { score: 3, text: 'Good', color: 'text-yellow-600' },
      { score: 4, text: 'Strong', color: 'text-green-600' },
      { score: 5, text: 'Very Strong', color: 'text-green-700' }
    ];

    const strength = strengths.find(s => s.score === score) || strengths[0];
    setPasswordStrength(strength);
  }, [formData.new_password]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.new_password || !formData.confirm_password) {
      showError('Please fill in all fields', 'Validation Error');
      return;
    }

    if (formData.new_password.length < 6) {
      showError('Password must be at least 6 characters long', 'Validation Error');
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      showError('Passwords do not match', 'Validation Error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:7007'}/api/auth/reset-password`,
        { 
          email, 
          otp_code,
          new_password: formData.new_password,
          confirm_password: formData.confirm_password
        }
      );

      if (response.data.success) {
        showSuccess('Password reset successfully! Redirecting to login...', 'Success');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password. Please try again.';
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full shadow-lg mb-4">
              <LockClosedIcon className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Reset Password
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Create a new password for your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Field */}
            <div>
              <label htmlFor="new_password" className="block text-sm font-semibold text-gray-900 mb-2 dark:text-gray-100">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new_password"
                  name="new_password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.new_password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 placeholder-gray-500 bg-white text-gray-900"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {/* Password Strength Indicator */}
              {formData.new_password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Password Strength:</span>
                    <span className={`text-xs font-semibold ${passwordStrength.color}`}>
                      {passwordStrength.text}
                    </span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        passwordStrength.score === 1 ? 'bg-red-600 w-1/5' :
                        passwordStrength.score === 2 ? 'bg-orange-600 w-2/5' :
                        passwordStrength.score === 3 ? 'bg-yellow-600 w-3/5' :
                        passwordStrength.score === 4 ? 'bg-green-600 w-4/5' :
                        passwordStrength.score === 5 ? 'bg-green-700 w-full' :
                        'w-0'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-semibold text-gray-900 mb-2 dark:text-gray-100">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirm_password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 placeholder-gray-500 bg-white text-gray-900"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {/* Password Match Indicator */}
              {formData.confirm_password && (
                <div className="mt-2">
                  {formData.new_password === formData.confirm_password ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      <span className="text-xs">Passwords match</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <span className="text-xs">Passwords do not match</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-900 mb-2">Password Requirements:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className={formData.new_password.length >= 6 ? 'text-green-600' : ''}>
                  • At least 6 characters
                </li>
                <li className={/[A-Z]/.test(formData.new_password) && /[a-z]/.test(formData.new_password) ? 'text-green-600' : ''}>
                  • Mix of uppercase and lowercase letters (recommended)
                </li>
                <li className={/\d/.test(formData.new_password) ? 'text-green-600' : ''}>
                  • At least one number (recommended)
                </li>
                <li className={/[^a-zA-Z0-9]/.test(formData.new_password) ? 'text-green-600' : ''}>
                  • At least one special character (recommended)
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl py-3 px-4 text-sm font-semibold hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Resetting Password...
                </>
              ) : (
                <>
                  Reset Password
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back to Login */}
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
            Remember your password?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-200"
            >
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

