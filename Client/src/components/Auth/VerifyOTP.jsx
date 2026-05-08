import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useToastContext } from '../../contexts/ToastContext';
import axios from 'axios';
import { 
  ShieldCheckIcon, 
  ArrowLeftIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showError, showSuccess } = useToastContext();
  
  const email = location.state?.email;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      showError('Please enter your email first', 'Error');
      navigate('/forgot-password');
    }
  }, [email, navigate, showError]);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          showError('OTP has expired. Please request a new one.', 'Expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    // Check if pasted data is 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs[5].current?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      showError('Please enter the complete 6-digit OTP', 'Validation Error');
      return;
    }

    if (timer <= 0) {
      showError('OTP has expired. Please request a new one.', 'Expired');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:7007'}/api/auth/verify-otp`,
        { email, otp_code: otpCode }
      );

      if (response.data.success) {
        showSuccess('OTP verified successfully', 'Success');
        // Navigate to reset password page with email and verified OTP
        navigate('/reset-password', { state: { email, otp_code: otpCode } });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Invalid OTP. Please try again.';
      showError(errorMessage, 'Error');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs[0].current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (isResending) return;

    setIsResending(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:7007'}/api/auth/resend-otp`,
        { email }
      );

      if (response.data.success) {
        showSuccess('New OTP sent to your email', 'Success');
        setTimer(600); // Reset timer
        setOtp(['', '', '', '', '', '']);
        inputRefs[0].current?.focus();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to resend OTP. Please try again.';
      showError(errorMessage, 'Error');
    } finally {
      setIsResending(false);
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-full shadow-lg mb-4">
              <ShieldCheckIcon className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Verify OTP
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Enter the 6-digit code sent to <br />
              <span className="font-semibold text-gray-900">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3 text-center dark:text-gray-100">
                Enter Verification Code
              </label>
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={inputRefs[index]}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <ClockIcon className="h-5 w-5" />
              <span>
                Time remaining: <span className={`font-semibold ${timer < 60 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatTime(timer)}
                </span>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || timer <= 0}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl py-3 px-4 text-sm font-semibold hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify OTP
                  <ShieldCheckIcon className="h-4 w-4 ml-2" />
                </>
              )}
            </button>

            {/* Resend OTP */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Didn't receive the code?
              </p>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isResending}
                className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200 disabled:opacity-50"
              >
                {isResending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent mr-1" />
                    Resending...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    Resend Code
                  </>
                )}
              </button>
            </div>

            {/* Back to Forgot Password */}
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Email Entry
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;

