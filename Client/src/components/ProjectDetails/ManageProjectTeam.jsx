import React, { useState, useEffect } from 'react';
import { useUserStore, useProjectStore, ROLES, apiCall } from '../../store';
import { 
  XMarkIcon,
  UserGroupIcon,
  UserPlusIcon,
  UserMinusIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import roleUtils from '../../utils/roleUtils';

const ManageProjectTeam = ({ project, onClose, onTeamUpdated }) => {
  const { users, fetchUsers, pagination } = useUserStore();
  const { updateProject, fetchProjects } = useProjectStore();
  
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [allLoadedUsers, setAllLoadedUsers] = useState([]);

  // current user info
  const currentUserRole = roleUtils.getRoleFromLocalStorage();
  const currentUserId = roleUtils.getUserFromLocalStorage()?.result?.user_id;

  // Initial load
  useEffect(() => {
    const loadInitialUsers = async () => {
      setIsLoadingMore(true);
      await fetchUsers(1, 50, {});
      setIsLoadingMore(false);
    };
    loadInitialUsers();
  }, [fetchUsers]);

  // Accumulate users as they're loaded
  useEffect(() => {
    if (users && users.length > 0) {
      setAllLoadedUsers(prevUsers => {
        // Merge new users with existing, avoiding duplicates
        const existingIds = new Set(prevUsers.map(u => u.user_id));
        const newUsers = users.filter(u => !existingIds.has(u.user_id));
        return [...prevUsers, ...newUsers];
      });
      
      // Check if there are more pages to load
      if (pagination) {
        setHasMore(pagination.page < pagination.pages);
      }
    }
  }, [users, pagination]);

  // Filter available users from accumulated users
  useEffect(() => {
    if (allLoadedUsers && project) {
      // Filter out users who are already in the project team
      const currentTeamIds = project.team?.map(member => member.user_id || member.id) || [];
      // Only show developers for team assignment
      const filtered = allLoadedUsers.filter(user => 
        !currentTeamIds.includes(user.user_id) && user.role === 'developer'
      );
      setAvailableUsers(filtered);
    }
  }, [allLoadedUsers, project]);

  // Load more users when scrolling
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    await fetchUsers(nextPage, 50, {});
    setCurrentPage(nextPage);
    setIsLoadingMore(false);
  };

  const handleAddMember = async (user) => {
    try {
      setIsSubmitting(true);
      setError('');

      const payload = {
        projectId: parseInt(project.id || project.project_id),
        userId: parseInt(user.user_id),
        role: 'developer'
      };

      const result = await apiCall(`/assignments`, {
        method: 'POST',
        body: JSON.stringify(payload),
        requiredRoles: [ROLES.ADMIN, ROLES.MANAGER]
      });

      if (result.success && result.data && result.data.success) {
        // Get the newly created assignment with user details
        const newAssignment = result.data.data?.assignment || result.data.assignment;
        
        // Add the user directly to the project team with assignment_id (optimistic update)
        const updatedTeam = [...(project.team || []), {
          user_id: user.user_id,
          id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role,
          assigned_at: new Date().toISOString(),
          assignment_id: newAssignment?.assignment_id || newAssignment?.id
        }];
        
        // Update the project with the new team
        const updatedProject = { ...project, team: updatedTeam };
        onTeamUpdated(updatedProject);
        
        // Remove user from available users and all loaded users
        setAvailableUsers(prev => prev.filter(u => u.user_id !== user.user_id));
        setAllLoadedUsers(prev => prev.filter(u => u.user_id !== user.user_id));
        
        // Refresh the full projects list in the background
        fetchProjects();
      } else {
        const message = (result.data && result.data.message) || result.error || 'Failed to add team member';
        setError(message);
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberToRemove) => {
    if (!project.team) {
      setError('No team members found');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      // Get assignment_id directly from the member object (should be added by store transformation)
      let assignmentId = memberToRemove.assignment_id;
      
      // If assignment_id is not available, try to fetch it from the project assignments
      if (!assignmentId && project.assignments) {
        const assignment = project.assignments.find(
          a => (a.user?.user_id || a.user_id) === (memberToRemove.user_id || memberToRemove.id)
        );
        assignmentId = assignment?.assignment_id || assignment?.id;
      }
      
      // Last resort: fetch from API
      if (!assignmentId) {
        const projectId = project.project_id || project.id;
        const assignmentsResult = await apiCall(`/projects/${projectId}/members`, {
          requiredRoles: [ROLES.ADMIN, ROLES.MANAGER]
        });

        if (!assignmentsResult.success) {
          setError(assignmentsResult.error || 'Failed to fetch team members');
          return;
        }

        const members = assignmentsResult.data?.data?.members || assignmentsResult.data?.members || [];

        if (!members || members.length === 0) {
          setError('No team members found for this project');
          return;
        }

        const assignment = members.find(
          member => (member.user_id || member.id) === (memberToRemove.user_id || memberToRemove.id)
        );

        if (!assignment) {
          setError('Team member assignment not found');
          return;
        }

        assignmentId = assignment.assignment_id || assignment.id;
      }
      
      if (!assignmentId) {
        setError('Unable to identify team member assignment');
        return;
      }

      // Delete the assignment
      const deleteResult = await apiCall(`/assignments/${assignmentId}`, { 
        method: 'DELETE', 
        requiredRoles: [ROLES.ADMIN, ROLES.MANAGER] 
      });

      if (deleteResult.success) {
        // Optimistic update: remove from team
        const updatedTeam = (project.team || []).filter(
          member => (member.user_id || member.id) !== (memberToRemove.user_id || memberToRemove.id)
        );
        
        const updatedProject = { ...project, team: updatedTeam };
        onTeamUpdated(updatedProject);
        
        // Add user back to available users (only if they're a developer)
        if (memberToRemove.role === 'developer') {
          const userToAdd = {
            user_id: memberToRemove.user_id || memberToRemove.id,
            name: memberToRemove.name,
            email: memberToRemove.email,
            role: memberToRemove.role
          };
          setAvailableUsers(prev => [...prev, userToAdd]);
          setAllLoadedUsers(prev => [...prev, userToAdd]);
        }
        
        // Refresh projects in background
        fetchProjects();
      } else {
        const message = deleteResult.error || deleteResult.data?.message || 'Failed to remove team member';
        setError(message);
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while removing team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAvailableUsers = availableUsers.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!project) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Project Team</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {project.name || project.project_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Current Team Members */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Team Members</h3>
            {project.team && project.team.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {project.team.map((member) => (
                  <div key={member.user_id || member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {member.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                      </div>
                    </div>
                    {(currentUserRole === ROLES.ADMIN || currentUserRole === ROLES.MANAGER) ? (
                      <button
                        onClick={() => handleRemoveMember(member)}
                        disabled={isSubmitting}
                        className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove from team"
                      >
                        <UserMinusIcon className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500">View only</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <UserGroupIcon className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No team members assigned yet</p>
              </div>
            )}
          </div>

          {/* Add New Team Members */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Team Members</h3>
            
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Available Users */}
            {filteredAvailableUsers.length > 0 ? (
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto"
                onScroll={(e) => {
                  const { scrollTop, scrollHeight, clientHeight } = e.target;
                  // Load more when user scrolls to bottom (with 50px threshold)
                  if (scrollHeight - scrollTop <= clientHeight + 50) {
                    handleLoadMore();
                  }
                }}
              >
                {filteredAvailableUsers.map((user) => (
                  <div key={user.user_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    {(currentUserRole === ROLES.ADMIN || currentUserRole === ROLES.MANAGER) ? (
                      <button
                        onClick={() => handleAddMember(user)}
                        disabled={isSubmitting}
                        className="p-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50"
                        title="Add to team"
                      >
                        <UserPlusIcon className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500">No permission</span>
                    )}
                  </div>
                ))}
                
                {/* Loading indicator */}
                {isLoadingMore && (
                  <div className="col-span-full flex justify-center py-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                )}
                
                {/* End of list indicator */}
                {!hasMore && filteredAvailableUsers.length > 0 && (
                  <div className="col-span-full text-center py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">All users loaded</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {searchTerm ? (
                  <>
                    <MagnifyingGlassIcon className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No users found matching your search</p>
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No available users to add</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageProjectTeam;
