import React from 'react';

const ProfileImage = ({ 
  user, 
  size = 'md', 
  className = '', 
  showOnlineStatus = false,
  onClick = null 
}) => {
  // Size configurations
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-24 h-24 text-2xl'
  };

  // Get user initials
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get profile image URL
  const getProfileImageUrl = (profile) => {
    console.log('🔍 ProfileImage - Raw profile value:', profile);
    if (!profile || profile === 'No File' || profile === '') return null;
    
    // If it's already a full URL, return as is
    if (profile.startsWith('http')) return profile;
    
    // If it's a relative path, construct the full URL
    const cleanPath = profile.replace(/\\/g, '/').replace('public/', '');
    const fullUrl = `http://localhost:7007${cleanPath}`;
    console.log('🔍 ProfileImage - Constructed URL:', fullUrl);
    return fullUrl;
  };
  const profileImageUrl = getProfileImageUrl(user?.profile);
  const initials = getInitials(user?.name);
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div 
      className={`relative flex-shrink-0 ${className}`}
      onClick={onClick}
    >
      <div className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg overflow-hidden`}>
        {profileImageUrl ? (
          <img 
            src={profileImageUrl} 
            alt={`${user?.name || 'User'}'s profile`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <span 
          className={`text-white font-semibold ${profileImageUrl ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}
        >
          {initials}
        </span>
      </div>
      
      {/* Online status indicator */}
      {showOnlineStatus && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
      )}
    </div>
  );
};

export default ProfileImage;
