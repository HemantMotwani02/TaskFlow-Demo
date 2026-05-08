import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon, 
  CameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useAuthStore, ROLES, ROLE_NAMES } from '../../store';
import ProfileImage from '../ProfileImage/ProfileImage';
import { useToastContext } from '../../contexts/ToastContext';

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { showError, showSuccess } = useToastContext();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      console.log('🔍 Settings - User object updated:', user);
      console.log('🔍 Settings - User profile path:', user.profile);
      console.log('🔍 Settings - User name from store:', user.name);
      const newFormData = {
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      console.log('🔍 Settings - Setting form data:', newFormData);
      setFormData(newFormData);
      
      // Convert profile path to full URL if it exists
      if (user.profile && user.profile !== 'No File' && user.profile !== '') {
        const profileUrl = user.profile.startsWith('http') 
          ? user.profile 
          : `http://localhost:7007${user.profile}`;
        console.log('🔍 Settings - Setting preview image URL:', profileUrl);
        setPreviewImage(profileUrl);
      } else {
        setPreviewImage(null);
      }
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showError('Image size should be less than 5MB', 'File Size Error');
        return;
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        showError('Please select a valid image file (JPG, PNG, or GIF)', 'Invalid File Type');
        return;
      }
      
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    console.log('🎯 Form submitted!');
    setIsLoading(true);

    try {
      const updateData = {
        name: formData.name,
        email: formData.email
      };
      
      console.log('🔍 Settings - Form data name:', formData.name);
      console.log('🔍 Settings - Update data being sent:', updateData);

      // Only allow role updates for admins
      if (user?.role === ROLES.ADMIN && formData.role !== user.role) {
        updateData.role = formData.role;
      }

      if (profileImage) {
        console.log('📷 Profile image selected:', profileImage.name, profileImage.size);
        updateData.profile_image = profileImage;
      } else {
        console.log('📷 No profile image selected');
      }

      console.log('📝 Update data:', updateData);
      const result = await updateUser(updateData);
      
      if (result.success) {
        showSuccess('Profile updated successfully!', 'Success');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        setProfileImage(null);
        // Update preview image with the new profile path from the server response
        if (result.user && result.user.profile) {
          const profileUrl = result.user.profile.startsWith('http') 
            ? result.user.profile 
            : `http://localhost:7007${result.user.profile}`;
          console.log('🔍 Settings - Updating preview image after upload:', profileUrl);
          setPreviewImage(profileUrl);
        }
      } else {
        // If updateUser failed but we have a profile image, try a direct FormData upload as a fallback
        if (profileImage) {
          try {
            console.debug('⚠️ updateUser failed, attempting direct FormData upload fallback');
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('profile_image', profileImage);
            formData.append('updates', JSON.stringify(updateData));

            const resp = await fetch('/api/upload-profile', {
              method: 'PUT',
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: formData
            });

            const json = await resp.json();
            console.debug('🔁 Direct upload response:', json);
            if (resp.ok && json && json.success) {
              const updatedUser = (json.data && json.data.data && json.data.data.user) || json.data?.user || json.user || json.data;
              if (updatedUser) {
                // Update preview and local store by calling the auth store setter
                try {
                  const { useAuthStore } = require('../../store');
                  const setUser = useAuthStore.getState().updateUser ? (u => useAuthStore.setState({ user: u })) : (u => useAuthStore.setState({ user: u }));
                  setUser(updatedUser);
                } catch (e) {
                  console.warn('Could not update auth store directly:', e);
                }

                setPreviewImage(updatedUser.profile && (updatedUser.profile.startsWith('http') ? updatedUser.profile : `http://localhost:7007${updatedUser.profile}`));
                showSuccess('Profile updated successfully via fallback upload', 'Success');
                setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
                setProfileImage(null);
              } else {
                showError('Upload succeeded but server did not return updated user', 'Upload Error');
              }
            } else {
              showError(json?.message || 'Failed to upload profile image', 'Upload Error');
            }
          } catch (fallbackError) {
            console.error('Fallback upload error:', fallbackError);
            showError('Failed to update profile (fallback upload failed)', 'Update Error');
          }
        } else {
          showError(result.error || 'Failed to update profile', 'Update Error');
        }
      }
    } catch (error) {
      showError('An error occurred while updating profile', 'Network Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      showError('New passwords do not match', 'Validation Error');
      return;
    }

    if (formData.newPassword.length < 6) {
      showError('Password must be at least 6 characters long', 'Validation Error');
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateUser({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (result.success) {
        showSuccess('Password changed successfully!', 'Success');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        showError(result.error || 'Failed to change password', 'Password Error');
      }
    } catch (error) {
      showError('An error occurred while changing password', 'Network Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your account settings and preferences</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Profile Information
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Update your personal information</p>
          </div>

          <div className="p-6">
            <form onSubmit={handleProfileUpdate}>
              {/* Profile Picture */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                      {previewImage ? (
                        <img 
                          src={previewImage} 
                          alt="Profile Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ProfileImage user={user} size="2xl" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-full cursor-pointer transition-colors">
                      <CameraIcon className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Upload a new profile picture
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      JPG, PNG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>

                             {/* Email */}
               <div className="mb-4">
                 <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Email Address
                 </label>
                 <input
                   type="email"
                   id="email"
                   name="email"
                   value={formData.email}
                   onChange={handleInputChange}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                   placeholder="Enter your email address"
                   required
                 />
               </div>

               {/* Role */}
               <div className="mb-6">
                 <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                   <ShieldCheckIcon className="h-4 w-4 mr-1" />
                   Role
                 </label>
                 {user?.role === ROLES.ADMIN ? (
                   <select
                     id="role"
                     name="role"
                     value={formData.role}
                     onChange={handleInputChange}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                   >
                     <option value={ROLES.ADMIN} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                       {ROLE_NAMES[ROLES.ADMIN]}
                     </option>
                     <option value={ROLES.MANAGER} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                       {ROLE_NAMES[ROLES.MANAGER]}
                     </option>
                     <option value={ROLES.DEVELOPER} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                       {ROLE_NAMES[ROLES.DEVELOPER]}
                     </option>
                   </select>
                 ) : (
                   <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                     {ROLE_NAMES[formData.role] || 'Unknown Role'}
                   </div>
                 )}
                 {user?.role !== ROLES.ADMIN && (
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                     Role can only be changed by administrators
                   </p>
                 )}
               </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors disabled:cursor-not-allowed"
              >
                {isLoading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <LockClosedIcon className="h-5 w-5 mr-2" />
              Change Password
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Update your password for security</p>
          </div>

          <div className="p-6">
            <form onSubmit={handlePasswordChange}>
              {/* Current Password */}
              <div className="mb-4">
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your current password"
                  required
                />
              </div>

              {/* New Password */}
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your new password"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm your new password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-md transition-colors disabled:cursor-not-allowed"
              >
                {isLoading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
