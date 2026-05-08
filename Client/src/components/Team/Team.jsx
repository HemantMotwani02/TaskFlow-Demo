import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useUserStore, ROLES, ROLE_NAMES } from '../../store';
import { useAuthStore } from '../../store';
import EditTeamMemberForm from './EditTeamMemberForm';
import ConfirmDialog from '../Confirm/ConfirmDialog';
import AddUserForm from './AddUserForm';
import {
  MagnifyingGlassIcon,
  UserIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  CogIcon
} from '@heroicons/react/24/outline';

// Memoized Search Input Component
const SearchInput = memo(({ value, onChange, placeholder }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
    </div>
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="block w-64 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
));

// Memoized Role Filter Component
const RoleFilter = memo(({ value, onChange }) => (
  <select
    value={value}
    onChange={onChange}
    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
  >
    <option value="all" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">All Roles</option>
    <option value={ROLES.ADMIN} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Admin</option>
    <option value={ROLES.MANAGER} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Manager</option>
    <option value={ROLES.DEVELOPER} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Developer</option>
  </select>
));

const Team = () => {
  const { users, pagination, isLoading, error, fetchUsers, roleCounts, fetchRoleCounts } = useUserStore();
  const { canAccess } = useAuthStore();
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [confirmState, setConfirmState] = useState({ open: false, userId: null });
  
  const isInitialLoad = useRef(true);

  // Load role counts and initial users on component mount
  useEffect(() => {
    // Only fetch if user has permission
    if (canAccess([ROLES.ADMIN, ROLES.MANAGER])) {
      fetchRoleCounts();
      fetchUsers(1, 50, {}); // Fetch all users for client-side filtering
      isInitialLoad.current = false;
    }
  }, [canAccess]);

  // Client-side filtering like the task page
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Pagination
  const indexOfLastItem = currentPage * pageSize;
  const indexOfFirstItem = indexOfLastItem - pageSize;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole]);

  const handleDeleteUser = (userId) => {
    setConfirmState({ open: true, userId });
  };

  const handleConfirmDelete = async () => {
    const userId = confirmState.userId;
    setConfirmState({ open: false, userId: null });
    const result = await useUserStore.getState().deleteUser(userId);
    if (result.success) {
      fetchRoleCounts();
    }
  };

  const handleCancelDelete = () => setConfirmState({ open: false, userId: null });

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditForm(true);
  };

  const handleUserUpdated = (updatedUser) => {
    // Refresh the users list and role counts
    fetchUsers(1, 50, {}); // Fetch all users for client-side filtering
    fetchRoleCounts();
    setShowEditForm(false);
    setSelectedUser(null);
  };

  const handleUserAdded = (newUser) => {
    // Refresh the users list and role counts
    fetchUsers(1, 50, {}); // Fetch all users for client-side filtering
    fetchRoleCounts();
    setShowAddUserForm(false);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Handle filter changes - reset to page 1
  const handleSearchChange = useCallback((newSearchTerm) => {
    setSearchTerm(newSearchTerm);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilterRole) => {
    setFilterRole(newFilterRole);
    setCurrentPage(1);
  }, []);


  const getRoleBadgeColor = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case ROLES.MANAGER:
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case ROLES.DEVELOPER:
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
        Inactive
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading team members</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Team Management</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300 mt-1">
              {canAccess([ROLES.ADMIN]) ? 'Manage your team members and their roles' : 'View team members and their roles'}
            </p>
          </div>
          {canAccess([ROLES.ADMIN]) && (
            <button
              onClick={() => setShowAddUserForm(true)}
              className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-xs sm:text-sm self-start"
            >
              Add User
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2 sm:p-4">
            <div className="flex items-center">
              <div className="p-1 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <UserGroupIcon className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-2 sm:ml-3">
                <p className="text-[10px] sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">{roleCounts.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2 sm:p-4">
            <div className="flex items-center">
              <div className="p-1 sm:p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <ShieldCheckIcon className="h-4 w-4 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-2 sm:ml-3">
                <p className="text-[10px] sm:text-sm font-medium text-gray-500 dark:text-gray-400">Admins</p>
                <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {roleCounts.admins}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2 sm:p-4">
            <div className="flex items-center">
              <div className="p-1 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CogIcon className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-2 sm:ml-3">
                <p className="text-[10px] sm:text-sm font-medium text-gray-500 dark:text-gray-400">Managers</p>
                <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {roleCounts.managers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2 sm:p-4">
            <div className="flex items-center">
              <div className="p-1 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <UserIcon className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-2 sm:ml-3">
                <p className="text-[10px] sm:text-sm font-medium text-gray-500 dark:text-gray-400">Developers</p>
                <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {roleCounts.developers}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4 sm:mb-6">
        <div className="p-3 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white">Team Members</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-4">
              {/* Search */}
              <div className="relative flex-1 sm:flex-none">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="block w-full sm:w-64 pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Role Filter */}
              <select
                value={filterRole}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">All Roles</option>
                <option value={ROLES.ADMIN} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Admin</option>
                <option value={ROLES.MANAGER} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Manager</option>
                <option value={ROLES.DEVELOPER} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Developer</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Users Table */}
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md border border-gray-200 dark:border-gray-700">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {currentUsers.length === 0 ? (
                <li className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  {searchTerm || filterRole !== 'all' ? 'No users found matching your criteria' : 'No users found'}
                </li>
              ) : (
                currentUsers.map((user) => (
                  <li key={user.user_id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name || 'No Name'}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email || 'No Email'}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                          {ROLE_NAMES[user.role] || 'Unknown'}
                        </span>
                        {getStatusBadge(user.isActive)}
                        {canAccess([ROLES.ADMIN]) && (
                          <div className="flex flex-col xs:flex-row gap-2 xs:space-x-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-xs sm:text-sm font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.user_id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 text-xs sm:text-sm font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} results
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 text-sm border rounded ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Team Member Form Modal */}
      {showEditForm && selectedUser && (
        <EditTeamMemberForm
          user={selectedUser}
          onClose={() => {
            setShowEditForm(false);
            setSelectedUser(null);
          }}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {/* Add User Form Modal */}
      {showAddUserForm && (
        <AddUserForm
          onClose={() => setShowAddUserForm(false)}
          onUserAdded={handleUserAdded}
        />
      )}

      {/* Confirm Delete User */}
      <ConfirmDialog
        open={confirmState.open}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default Team;
