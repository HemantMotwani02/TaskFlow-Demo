import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Role mapping constants
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  DEVELOPER: 'developer'
};

export const ROLE_NAMES = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.DEVELOPER]: 'Developer'
};

// API utility function for consistent error handling
import toastService from '../utils/toastService';
import roleUtils from '../utils/roleUtils';

 export const apiCall = async (url, options = {}) => {
  try {
    const token = roleUtils.getTokenFromLocalStorage();
    // Client-side authorization short-circuit: if caller specified requiredRoles and user not authorized, skip call
    if (options && options.requiredRoles) {
      const ok = roleUtils.isAuthorized(options.requiredRoles);
      if (!ok) {
        const err = 'Unauthorized: current user does not have required role(s) to perform this action';
        toastService.showError(err, 'Unauthorized');
        return { success: false, error: err };
      }
    }
    const defaultHeaders = {
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    // Merge with options headers, allowing them to override defaults
    const headers = {
      ...defaultHeaders,
      ...options.headers
    };

    // If caller provided a body and it's NOT FormData, ensure Content-Type is set
    if (options.body && !(options.body instanceof FormData)) {
      // If caller didn't explicitly set Content-Type (case-insensitive), default to JSON
      const hasContentType = Object.keys(headers).some(k => k.toLowerCase() === 'content-type');
      if (!hasContentType) {
        headers['Content-Type'] = 'application/json';
      }
    }

    // Use relative URLs to take advantage of Vite proxy
    const apiUrl = url.startsWith('http') ? url : `/api${url.startsWith('/') ? url : `/${url}`}`;

  const method = options.method || 'GET';
  const body = typeof options.body !== 'undefined' ? options.body : null;
  console.log('🔍 apiCall - URL:', apiUrl);
  console.log('🔍 apiCall - Method:', method);
  console.log('🔍 apiCall - Headers:', headers);
  console.log('🔍 apiCall - Body:', body);
  console.log('🔍 apiCall - Body type:', body === null ? 'null' : typeof body);

    const response = await fetch(apiUrl, {
      ...options,
      method,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || `HTTP error! status: ${response.status}`;
      // Show error toast globally
      toastService.showError(errorMessage, 'Request Failed');
      throw new Error(errorMessage);
    }

    // If caller passed a successMessage in options.meta, show it
    if (options && options.meta && options.meta.successMessage) {
      toastService.showSuccess(options.meta.successMessage, 'Success');
    }

    return { success: true, data };
  } catch (error) {
    console.error('API call error:', error);
    if (error && error.name !== 'AbortError') {
      // Network or unexpected error
      toastService.showError(error.message || 'Network error', 'Network Error');
    }
    return { 
      success: false, 
      error: error.message || 'Network error - Please check if the server is running' 
    };
  }
};

// Auth Store
export const useAuthStore = create(
  devtools(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Initialize authentication state on app load
      initializeAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isAuthenticated: false, user: null, isLoading: false });
          return;
        }

        try {
          set({ isLoading: true, error: null });
          const result = await apiCall('/auth/me');
          
          if (result.success && result.data.success) {
            set({ 
              user: result.data.data.user, 
              isAuthenticated: true, 
              isLoading: false,
              error: null
            });
            // Persist a legacy `user` object for components that still read localStorage.user
            try {
              localStorage.setItem('user', JSON.stringify({ result: result.data.data.user, token: result.data.data.token }));
            } catch (e) {}
          } else {
            // Token is invalid, clear it
            console.warn('Invalid token during initialization, clearing...');
            localStorage.removeItem('token');
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false,
              error: null
            });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          // Only clear token if it's an authentication error, not a network error
          if (error.message && (error.message.includes('401') || error.message.includes('403') || error.message.includes('Invalid token'))) {
            localStorage.removeItem('token');
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false,
              error: 'Session expired. Please login again.'
            });
          } else {
            // For network errors, keep the token and let the user retry
            set({ 
              isLoading: false,
              error: 'Network error. Please check your connection.'
            });
          }
        }
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        const result = await apiCall('/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials),
          meta: { successMessage: 'Logged in successfully' }
        });
        
        if (result.success && result.data.success) {
          console.log('🔍 Login - User data from server:', result.data.data.user);
          console.log('🔍 Login - User name from server:', result.data.data.user.name);
          set({ 
            user: result.data.data.user, 
            isAuthenticated: true, 
            isLoading: false 
          });
          localStorage.setItem('token', result.data.data.token);
          try {
            localStorage.setItem('user', JSON.stringify({ result: result.data.data.user, token: result.data.data.token }));
          } catch (e) {}
          return { success: true };
        } else {
          const errorMessage = result.error || result.data?.message || 'Login failed';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        try { localStorage.removeItem('user'); } catch (e) {}
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null 
        });
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        
        const result = await apiCall('/auth/register', {
          method: 'POST',
          body: JSON.stringify(userData),
          meta: { successMessage: 'Registration successful' }
        });
        
        if (result.success && result.data.success) {
          set({ isLoading: false });
          return { success: true };
        } else {
          const errorMessage = result.error || result.data?.message || 'Registration failed';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return { success: false, error: errorMessage };
        }
      },

      // Helper methods
      hasRole: (role) => {
        const { user } = get();
        if (!user) return false;
        return user.role === role;
      },

      isAdmin: () => get().hasRole(ROLES.ADMIN),
      isManager: () => get().hasRole(ROLES.MANAGER),
      isDeveloper: () => get().hasRole(ROLES.DEVELOPER),

      canAccess: (requiredRoles) => {
        const { user } = get();
        if (!user) return false;
        if (Array.isArray(requiredRoles)) {
          return requiredRoles.includes(user.role);
        }
        return user.role === requiredRoles;
      },

      updateUser: async (updates) => {
        console.log('🔄 updateUser called with:', updates);
        set({ isLoading: true, error: null });
        
        const { user } = get();
        if (!user) {
          console.log('❌ No user logged in');
          set({ isLoading: false, error: 'No user logged in' });
          return { success: false, error: 'No user logged in' };
        }
        
        console.log('👤 Current user:', user);

        try {
          // Handle file upload if profile_image is provided
          let body;
          if (updates.profile_image && updates.profile_image instanceof File) {
            console.log('📁 File upload detected:', updates.profile_image.name, updates.profile_image.size);
            const formData = new FormData();
            formData.append('profile_image', updates.profile_image);
            
            // Add other fields as JSON string
            const { profile_image, ...otherUpdates } = updates;
            if (Object.keys(otherUpdates).length > 0) {
              formData.append('updates', JSON.stringify(otherUpdates));
            }
            
            body = formData;
            console.log('📤 Sending FormData with file');
          } else {
            console.log('📤 Sending JSON data');
            body = JSON.stringify(updates);
          }

          const headers = {};
          // Don't set Content-Type for FormData - let browser set it with boundary
          if (!(body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
          }

          console.log('🚀 Making API call to /upload-profile');
          console.log('📤 Request body type:', typeof body);
          console.log('📤 Request body instanceof FormData:', body instanceof FormData);
          console.log('📤 Headers:', headers);
          
          const result = await apiCall(`/upload-profile`, {
            method: 'PUT',
            body,
            headers,
            meta: { successMessage: 'Profile updated successfully' }
          });
          
          console.log('📥 API response:', result);
          
          if (result.success && result.data && result.data.success) {
            // API responses may nest the user in different shapes. Normalize them.
            const payload = result.data || {};
            const updatedUser = (
              payload.data?.user || // shape: { data: { user } }
              payload.data?.data?.user || // shape: { data: { data: { user } } }
              payload.user || // shape: { user }
              payload.data // sometimes server returns user directly in data
            );

            set({ 
              user: updatedUser, 
              isLoading: false 
            });
            return { success: true, user: updatedUser };
          } else {
            const errorMessage = result.error || result.data?.message || 'Failed to update profile';
            set({ 
              error: errorMessage, 
              isLoading: false 
            });
            return { success: false, error: errorMessage };
          }
        } catch (error) {
          const errorMessage = error.message || 'An error occurred while updating profile';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return { success: false, error: errorMessage };
        }
      },

      clearError: () => set({ error: null })
    }),
    { name: 'auth-store' }
  )
);

// User Store
export const useUserStore = create(
  devtools(
    (set, get) => ({
      users: [],
      managers: [],
      isLoading: false,
      error: null,
      roleCounts: {
        total: 0,
        admins: 0,
        managers: 0,
        developers: 0
      },
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      },

      fetchUsers: async (page = 1, limit = 10, filters = {}) => {
        set({ isLoading: true, error: null });
        
        // Build query parameters
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...filters
        });
        
        const result = await apiCall(`/users?${params}`);
        
        if (result.success && result.data.success) {
          const users = (result.data.data?.users || []).map(user => ({
            ...user,
            roleName: ROLE_NAMES[user.role] || 'Unknown',
            isActive: user.isActive !== false
          }));
          
          const pagination = result.data.data?.pagination || {
            page: 1,
            limit: 10,
            total: users.length,
            pages: 1
          };
          
          set({ 
            users, 
            pagination,
            isLoading: false 
          });
        } else {
          const errorMessage = result.error || result.data?.message || 'Failed to fetch users';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
        }
      },

      fetchRoleCounts: async () => {
        set({ isLoading: true, error: null });
        
        const result = await apiCall('/users/counts');
        
        if (result.success && result.data.success) {
          set({ 
            roleCounts: result.data.data,
            isLoading: false 
          });
        } else {
          const errorMessage = result.error || result.data?.message || 'Failed to fetch role counts';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
        }
      },

      fetchManagers: async () => {
        set({ isLoading: true, error: null });
        
        console.log('🔍 Fetching managers...');
        const result = await apiCall('/users/managers');
        console.log('📊 Managers API response:', result);
        
        if (result.success && result.data.success) {
          const managers = (result.data.data?.managers || []).map(manager => ({
            ...manager,
            roleName: ROLE_NAMES[manager.role] || 'Manager'
          }));
          console.log('👥 Processed managers:', managers);
          set({ managers, isLoading: false });
        } else {
          const errorMessage = result.error || result.data?.message || 'Failed to fetch managers';
          console.error('❌ Failed to fetch managers:', errorMessage);
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
        }
      },

      createUser: async (userData) => {
        set({ isLoading: true, error: null });
        
        const result = await apiCall('/users', {
          method: 'POST',
          body: JSON.stringify(userData),
          requiredRoles: [ROLES.ADMIN],
          meta: { successMessage: 'User created successfully' }
        });
        
        if (result.success && result.data.success) {
          const newUser = result.data.data?.user || result.data.user;
          const userWithRole = {
            ...newUser,
            roleName: ROLE_NAMES[newUser.role] || 'Unknown',
            isActive: newUser.isActive !== false
          };
          
          // Refresh the users list and role counts to get updated pagination and counts
          const currentState = get();
          await currentState.fetchUsers(currentState.pagination.page, currentState.pagination.limit);
          await currentState.fetchRoleCounts();
          
          return { success: true, user: userWithRole };
        } else {
          const errorMessage = result.error || result.data?.message || 'Failed to create user';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return { success: false, error: errorMessage };
        }
      },

      updateUser: async (userId, updates) => {
        set({ isLoading: true, error: null });
        
        const result = await apiCall(`/users/${userId}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
          requiredRoles: [ROLES.ADMIN],
          meta: { successMessage: 'User updated successfully' }
        });
        
        if (result.success && result.data.success) {
          const updatedUser = result.data.data?.user || result.data.user;
          const userWithRole = {
            ...updatedUser,
            roleName: ROLE_NAMES[updatedUser.role] || 'Unknown',
            isActive: updatedUser.isActive !== false
          };
          
          set(state => ({
            users: state.users.map(u => u.user_id === userId ? userWithRole : u),
            managers: state.managers.map(m => m.user_id === userId ? userWithRole : m),
            isLoading: false
          }));
          
          // Refresh role counts in case role was changed
          const currentState = get();
          await currentState.fetchRoleCounts();
          
          return { success: true, user: userWithRole };
        } else {
          const errorMessage = result.error || result.data?.message || 'Failed to update user';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return { success: false, error: errorMessage };
        }
      },

      deleteUser: async (userId) => {
        set({ isLoading: true, error: null });
        
        const result = await apiCall(`/users/${userId}`, {
          method: 'DELETE',
          requiredRoles: [ROLES.ADMIN],
          meta: { successMessage: 'User deleted successfully' }
        });
        
        if (result.success && result.data.success) {
          // Refresh the users list and role counts to get updated pagination and counts
          const currentState = get();
          await currentState.fetchUsers(currentState.pagination.page, currentState.pagination.limit);
          await currentState.fetchRoleCounts();
          
          return { success: true };
        } else {
          const errorMessage = result.error || result.data?.message || 'Failed to delete user';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return { success: false, error: errorMessage };
        }
      },

      // Helper methods
      getUserById: (userId) => {
        const { users } = get();
        return users.find(u => u.user_id === userId);
      },

      getActiveUsers: () => {
        const { users } = get();
        return users.filter(u => u.isActive);
      },

      getUsersByRole: (role) => {
        const { users } = get();
        return users.filter(u => u.role === role);
      },

      clearError: () => set({ error: null })
    }),
    { name: 'user-store' }
  )
);

// Permission Store
export const usePermissionStore = create(
  devtools(
    (set, get) => ({
      groups: [],
      definitions: [],
      isLoading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      },

      fetchDefinitions: async () => {
        set({ isLoading: true, error: null });
        const result = await apiCall('/permissions/definitions');

        if (result.success && result.data.success) {
          set({
            definitions: result.data.data?.definitions || [],
            isLoading: false
          });
        } else {
          set({
            error: result.error || 'Failed to fetch permission definitions',
            isLoading: false
          });
        }
      },

      fetchGroups: async (page = 1, limit = 10, search = '') => {
        set({ isLoading: true, error: null });
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit)
        });
        if (search?.trim()) params.set('q', search.trim());

        const result = await apiCall(`/permissions/groups?${params.toString()}`);
        if (result.success && result.data.success) {
          set({
            groups: result.data.data?.groups || [],
            pagination: result.data.data?.pagination || { page, limit, total: 0, pages: 0 },
            isLoading: false
          });
        } else {
          set({
            error: result.error || 'Failed to fetch permission groups',
            isLoading: false
          });
        }
      },

      fetchAssignableGroups: async () => {
        const result = await apiCall('/permissions/groups?page=1&limit=100');
        if (result.success && result.data.success) {
          return { success: true, groups: result.data.data?.groups || [] };
        }
        return { success: false, groups: [], error: result.error || 'Failed to fetch groups' };
      },

      createGroup: async (payload) => {
        const result = await apiCall('/permissions/groups', {
          method: 'POST',
          body: JSON.stringify(payload),
          requiredRoles: [ROLES.ADMIN],
          meta: { successMessage: 'Permission group created' }
        });
        if (result.success && result.data.success) {
          return { success: true };
        }
        return { success: false, error: result.error || 'Failed to create group' };
      },

      updateGroup: async (groupId, payload) => {
        const result = await apiCall(`/permissions/groups/${groupId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
          requiredRoles: [ROLES.ADMIN],
          meta: { successMessage: 'Permission group updated' }
        });
        if (result.success && result.data.success) {
          return { success: true };
        }
        return { success: false, error: result.error || 'Failed to update group' };
      },

      deleteGroup: async (groupId) => {
        const result = await apiCall(`/permissions/groups/${groupId}`, {
          method: 'DELETE',
          requiredRoles: [ROLES.ADMIN],
          meta: { successMessage: 'Permission group deleted' }
        });
        if (result.success && result.data.success) {
          return { success: true };
        }
        return { success: false, error: result.error || 'Failed to delete group' };
      },

      setDefaultGroup: async (groupId) => {
        const result = await apiCall(`/permissions/groups/${groupId}/default`, {
          method: 'PATCH',
          requiredRoles: [ROLES.ADMIN],
          meta: { successMessage: 'Default permission updated' }
        });
        if (result.success && result.data.success) {
          return { success: true };
        }
        return { success: false, error: result.error || 'Failed to update default group' };
      }
    }),
    { name: 'permission-store' }
  )
);

// Project Store
export const useProjectStore = create(
  devtools(
    (set, get) => ({
      projects: [],
      currentProject: null,
      isLoading: false,
      error: null,

      fetchProjects: async () => {
        set({ isLoading: true, error: null });

        const result = await apiCall('/projects');

        if (result.success && result.data.success) {
          console.log('📦 Raw projects data from backend:', result.data.data?.projects);
          
          // Transform backend data to match frontend expectations
          const allProjects = (result.data.data?.projects || []).map(project => {
            console.log(`📋 Processing project: ${project.project_name}`, {
              project_id: project.project_id,
              manager_id: project.manager_id,
              manager: project.manager
            });
            
            // Transform assignments into team array
            const team = (project.assignments || []).map(assignment => ({
              user_id: assignment.user?.user_id,
              id: assignment.user?.user_id,
              name: assignment.user?.name,
              email: assignment.user?.email,
              role: assignment.user?.role || assignment.role,
              assigned_at: assignment.assigned_at,
              assignment_id: assignment.assignment_id || assignment.id
            }));

            const transformedProject = {
              ...project,
              // Map backend fields to frontend expected fields
              project_id: project.project_id || project.id,
              project_name: project.project_name || project.name,
              project_details: project.project_details || project.description,
              // Keep original fields for backward compatibility
              id: project.project_id || project.id,
              name: project.project_name || project.name,
              description: project.project_details || project.description,
              // Add team data
              team: team,
              assignments: project.assignments
            };
            
            console.log(`✅ Transformed project: ${transformedProject.project_name}`, {
              project_id: transformedProject.project_id,
              manager_id: transformedProject.manager_id,
              manager: transformedProject.manager
            });
            
            return transformedProject;
          });

            // Client-side role-based filtering: admin sees all, manager sees projects assigned to them, developer sees projects they're assigned to
            // Use roleUtils to read stored user safely
            let currentUser = null;
            try {
              const roleUtils = require('../utils/roleUtils').default || require('../utils/roleUtils');
              currentUser = roleUtils.getUserFromLocalStorage()?.result || null;
            } catch (e) {
              try {
                const raw = localStorage.getItem('user');
                currentUser = raw ? JSON.parse(raw).result : null;
              } catch (err) {
                currentUser = null;
              }
            }

            let projects = allProjects;
            if (currentUser && currentUser.role) {
              console.log('🔍 Filtering projects for role:', currentUser.role);
              console.log('🔍 Current user ID:', currentUser.user_id || currentUser.userId || currentUser.id);
              console.log('🔍 Total projects before filtering:', allProjects.length);
              
              if (currentUser.role === 'manager') {
                projects = allProjects.filter(p => {
                  // manager as project.manager_id OR assignments include manager
                  const managerId = p.manager_id || p.manager?.user_id || p.manager?.id;
                  console.log(`🔍 Project "${p.project_name}" - manager_id: ${managerId}, checking against user_id: ${currentUser.user_id}`);
                  
                  if (managerId && parseInt(managerId) === parseInt(currentUser.user_id || currentUser.userId || currentUser.id)) {
                    console.log(`✅ Project "${p.project_name}" matched by manager_id`);
                    return true;
                  }
                  // also check assignments
                  const matchedByAssignment = (p.assignments || []).some(a => (a.user?.user_id || a.user_id || a.id) === (currentUser.user_id || currentUser.userId || currentUser.id));
                  if (matchedByAssignment) {
                    console.log(`✅ Project "${p.project_name}" matched by assignment`);
                  }
                  return matchedByAssignment;
                });
                console.log('🔍 Projects after filtering for manager:', projects.length);
              } else if (currentUser.role === 'developer') {
                projects = allProjects.filter(p => (p.assignments || []).some(a => (a.user?.user_id || a.user_id || a.id) === (currentUser.user_id || currentUser.userId || currentUser.id)));
                console.log('🔍 Projects after filtering for developer:', projects.length);
              } // admins get all
            }

            set({ projects, isLoading: false });
        } else {
          const errorMessage = result.error || result.data?.message || 'Failed to fetch projects';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
        }
      },

      fetchProjectById: async (projectId) => {
        set({ isLoading: true, error: null });
        
        const result = await apiCall(`/projects/${projectId}`);
        
        if (result.success && result.data.success) {
          const project = result.data.data?.project;
          if (project) {
            // Transform assignments into team array (same as in fetchProjects)
            const team = (project.assignments || []).map(assignment => ({
              user_id: assignment.user?.user_id,
              id: assignment.user?.user_id,
              name: assignment.user?.name,
              email: assignment.user?.email,
              role: assignment.user?.role || assignment.role,
              assigned_at: assignment.assigned_at,
              assignment_id: assignment.assignment_id || assignment.id
            }));

            // Transform backend data to match frontend expectations
            const transformedProject = {
              ...project,
              project_id: project.project_id || project.id,
              project_name: project.project_name || project.name,
              project_details: project.project_details || project.description,
              // Keep original fields for backward compatibility
              id: project.project_id || project.id,
              name: project.project_name || project.name,
              description: project.project_details || project.description,
              // Add team data with assignment_id
              team: team,
              assignments: project.assignments
            };
            set({ currentProject: transformedProject, isLoading: false });
            return transformedProject;
          }
        }
        
        const errorMessage = result.error || result.data?.message || 'Failed to fetch project';
        set({ error: errorMessage, isLoading: false });
        return null;
      },

      createProject: async (projectData) => {
        set({ isLoading: true, error: null });
        
        // Transform frontend data to backend expected format
        const backendData = {
          project_name: projectData.project_name || projectData.name,
          project_details: projectData.project_details || projectData.description,
          status: projectData.status || 'planning',
          managerId: projectData.managerId || projectData.manager_id
        };
        
        console.log('🚀 Creating project with data:', backendData);
        
        const result = await apiCall('/projects', {
          method: 'POST',
          body: JSON.stringify(backendData),
          requiredRoles: [ROLES.ADMIN, ROLES.MANAGER],
          meta: { successMessage: 'Project created successfully' }
        });
        
        console.log('📬 Project creation response:', result);
        
        if (result.success && result.data.success) {
          const createdProject = result.data.data?.project || result.data.data;
          console.log('✅ Project created successfully:', createdProject);
          console.log('🔄 Refreshing projects list...');
          
          await get().fetchProjects(); // Refresh projects list
          
          console.log('✅ Projects list refreshed');
          set({ isLoading: false });
          return { success: true, data: createdProject };
        } else {
          const errorMessage = result.error || result.data?.message || 'Failed to create project';
          console.error('❌ Project creation failed:', errorMessage);
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      updateProject: async (projectId, projectData) => {
        set({ isLoading: true, error: null });
        
        // Transform frontend data to backend expected format
        const backendData = {
          project_name: projectData.project_name || projectData.name,
          project_details: projectData.project_details || projectData.description,
          status: projectData.status,
          managerId: projectData.managerId || projectData.manager_id
        };
        
        const result = await apiCall(`/projects/${projectId}`, {
          method: 'PUT',
          body: JSON.stringify(backendData),
          requiredRoles: [ROLES.ADMIN, ROLES.MANAGER],
          meta: { successMessage: 'Project updated successfully' }
        });
        
        if (result.success && result.data.success) {
          await get().fetchProjects(); // Refresh projects list
          set({ isLoading: false });
          return { success: true };
        } else {
          const errorMessage = result.error || result.data?.message || 'Failed to update project';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      deleteProject: async (projectId) => {
        set({ isLoading: true, error: null });
        
        const result = await apiCall(`/projects/${projectId}`, {
          method: 'DELETE',
          requiredRoles: [ROLES.ADMIN],
          meta: { successMessage: 'Project deleted successfully' }
        });
        
        if (result.success) {
          set(state => ({
            projects: state.projects.filter(p => p.project_id !== projectId && p.id !== projectId),
            currentProject: get().currentProject?.project_id === projectId || get().currentProject?.id === projectId
              ? null 
              : get().currentProject,
            isLoading: false
          }));
          return { success: true };
        } else {
          const errorMessage = result.error || result.data?.message || 'Failed to delete project';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return { success: false, error: errorMessage };
        }
      },

      setCurrentProject: (project) => set({ currentProject: project }),
      clearError: () => set({ error: null }),
    }),
    { name: 'project-store' }
  )
);

// Task Store
export const useTaskStore = create(
  devtools(
    (set, get) => ({
      tasks: [],
      currentTask: null,
      isLoading: false,
      error: null,

      fetchTasks: async (projectId) => {
        set({ isLoading: true, error: null });
        
        const result = await apiCall(`/projects/${projectId}/tasks`);
        
        if (result.success && result.data.success) {
          // Transform backend data to match frontend expectations
          const tasks = (result.data.data?.tasks || []).map(task => ({
            ...task,
            // Map backend fields to frontend expected fields
            task_id: task.task_id || task.id,
            task_name: task.task_name || task.name,
            task_details: task.task_details || task.description,
            // Keep original fields for backward compatibility
            id: task.task_id || task.id,
            name: task.task_name || task.name,
            description: task.task_details || task.description
          }));
          set({ tasks, isLoading: false });
        } else {
          const errorMessage = result.error || result.data?.message || 'Failed to fetch tasks';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
        }
      },

      createTask: async (projectId, taskData) => {
        set({ isLoading: true, error: null });
        
        // Transform frontend data to backend expected format
        const backendData = {
          task_name: taskData.task_name || taskData.name,
          task_details: taskData.task_details || taskData.description,
          status: taskData.status || 'pending',
          estimate_time: taskData.estimate_time,
          projectId: projectId
        };
        
        const result = await apiCall('/tasks', {
          method: 'POST',
          body: JSON.stringify(backendData),
          requiredRoles: [ROLES.ADMIN, ROLES.MANAGER],
          meta: { successMessage: 'Task created successfully' }
        });
        
        if (result.success && result.data.success) {
          await get().fetchTasks(projectId); // Refresh tasks list
          set({ isLoading: false });
          return { success: true };
        } else {
          const errorMessage = result.error || result.data?.message || 'Failed to create task';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      updateTask: async (taskId, updates) => {
        set({ isLoading: true, error: null });
        
        const result = await apiCall(`/tasks/${taskId}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
          meta: { successMessage: 'Task updated successfully' }
        });
        
        if (result.success && result.data.success) {
          const updatedTask = result.data.data?.task || result.data.task;
          // Transform backend data to match frontend expectations
          const transformedTask = {
            ...updatedTask,
            task_id: updatedTask.id,
            task_name: updatedTask.title,
            task_details: updatedTask.description,
            // Keep original fields for backward compatibility
            title: updatedTask.title,
            description: updatedTask.description,
            id: updatedTask.id
          };
          set(state => ({
            tasks: state.tasks.map(t => 
              t.task_id === taskId || t.id === taskId ? { ...t, ...transformedTask } : t
            ),
            currentTask: get().currentTask?.task_id === taskId || get().currentTask?.id === taskId
              ? { ...get().currentTask, ...transformedTask }
              : get().currentTask,
            isLoading: false
          }));
          return { success: true, task: transformedTask };
        } else {
          const errorMessage = result.error || result.data?.message || 'Failed to update task';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return { success: false, error: errorMessage };
        }
      },

      deleteTask: async (taskId) => {
        set({ isLoading: true, error: null });
        
        const result = await apiCall(`/tasks/${taskId}`, {
          method: 'DELETE',
          requiredRoles: [ROLES.ADMIN, ROLES.MANAGER],
          meta: { successMessage: 'Task deleted successfully' }
        });
        
        if (result.success) {
          set(state => ({
            tasks: state.tasks.filter(t => t.task_id !== taskId && t.id !== taskId),
            currentTask: get().currentTask?.task_id === taskId || get().currentTask?.id === taskId
              ? null 
              : get().currentTask,
            isLoading: false
          }));
          return { success: true };
        } else {
          const errorMessage = result.error || result.data?.message || 'Failed to delete task';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return { success: false, error: errorMessage };
        }
      },

      setCurrentTask: (task) => set({ currentTask: task }),
      clearError: () => set({ error: null }),
    }),
    { name: 'task-store' }
  )
);

// UI Store
export const useUIStore = create(
  devtools(
    (set, get) => ({
      sidebar: false,
      theme: {
        mode: 'light'
      },
      notifications: [],
      lastNotificationIdSeen: null,

      toggleSidebar: () => set(state => ({ sidebar: !state.sidebar })),
      
      initializeTheme: () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const themeMode = savedTheme;
        set({ theme: { mode: themeMode } });
        localStorage.setItem('theme', themeMode);
        
        // Apply theme to document
        if (themeMode === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
          console.log('Dark mode initialized');
        } else {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
          console.log('Light mode initialized');
        }
      },

      toggleTheme: () => {
        const currentMode = get().theme.mode;
        const newMode = currentMode === 'light' ? 'dark' : 'light';
        set({ theme: { mode: newMode } });
        localStorage.setItem('theme', newMode);
        
        // Apply theme to document
        if (newMode === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
          console.log('Dark mode enabled');
        } else {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
          console.log('Light mode enabled');
        }
      },

      addNotification: (notification) => {
        const id = Date.now();
        const newNotification = { id, ...notification, timestamp: new Date() };
        set(state => ({ 
          notifications: [...state.notifications, newNotification] 
        }));
        
        // Auto remove after 5 seconds
        setTimeout(() => {
          set(state => ({ 
            notifications: state.notifications.filter(n => n.id !== id) 
          }));
        }, 5000);
      },

      removeNotification: (id) => {
        set(state => ({ 
          notifications: state.notifications.filter(n => n.id !== id) 
        }));
      },

      clearNotifications: () => set({ notifications: [] })
    }),
    { name: 'ui-store' }
  )
);
