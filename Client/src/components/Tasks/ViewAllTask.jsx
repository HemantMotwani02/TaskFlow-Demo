import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  ChartBarIcon,
  ClockIcon as ClockIconSolid,
  PencilIcon
} from '@heroicons/react/24/outline';
import { useTaskStore, useProjectStore, useUserStore } from '../../store';
import { useAuthStore, ROLES } from '../../store';
import { useToastContext } from '../../contexts/ToastContext';
import AddLogForm from './AddLogForm';
import EditTaskForm from './EditTaskForm';
import QuickStatusUpdate from './QuickStatusUpdate';

const ViewAllTask = () => {
  const navigate = useNavigate();
  const { project_id } = useParams();
  const { user, canAccess } = useAuthStore();
  
  // Debug: Log the URL params
  console.log('ViewAllTask URL params:', { project_id });
  console.log('ViewAllTask current URL:', window.location.pathname);
  const { updateTask } = useTaskStore();
  const { projects, fetchProjects, isLoading, error } = useProjectStore();
  const { users, fetchUsers } = useUserStore();
  const { showSuccess, showError } = useToastContext();
  
  // Only fetch users if admin/manager - developers don't need the user list
  useEffect(() => {
    if (canAccess([ROLES.ADMIN, ROLES.MANAGER])) {
      fetchUsers(1, 50, {});
    }
  }, [canAccess, fetchUsers]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAddLogForm, setShowAddLogForm] = useState(false);
  const [selectedTaskForLog, setSelectedTaskForLog] = useState(null);
  const [selectedProjectForLog, setSelectedProjectForLog] = useState(null);
  const [showEditTaskForm, setShowEditTaskForm] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null);
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [selectedTaskForAssign, setSelectedTaskForAssign] = useState(null);
  const [localTasks, setLocalTasks] = useState([]);

  useEffect(() => {
    fetchProjects();
    // Only fetch users if admin/manager - developers don't need to see the user list for assignment
    if (canAccess([ROLES.ADMIN, ROLES.MANAGER])) {
      fetchUsers(1, 50, { role: 'developer' }); // Fetch developers for assignment
    }
  }, [fetchProjects, fetchUsers, canAccess]);

  // Get current project details if project_id is provided
  const currentProject = project_id ? projects.find(p => {
    const pId = p.id || p.project_id || p.manager_id || p.created_by;
    return pId == project_id;
  }) : null;

  // Get project members (developers assigned to current project)
  const projectMembers = currentProject?.assignments?.map(assignment => assignment.user).filter(user => user?.role === 'developer') || [];
  
  // Function to get project members for a specific task
  const getProjectMembersForTask = (taskProjectId) => {
    console.log('Getting project members for task:', { taskProjectId, projects: projects.length });
    const taskProject = projects.find(p => {
      const pId = p.id || p.project_id || p.manager_id || p.created_by;
      return pId == taskProjectId;
    });
    console.log('Found project:', taskProject);
    console.log('Project assignments:', taskProject?.assignments);
    
    const members = taskProject?.assignments?.map(assignment => {
      console.log('Assignment:', assignment);
      return assignment.user;
    }).filter(user => {
      console.log('User role check:', { user, role: user?.role, isDeveloper: user?.role === 'developer' });
      return user?.role === 'developer';
    }) || [];
    
    console.log('Final members:', members);
    return members;
  };
  
  // Get all tasks from all projects
  const allTasks = projects.flatMap(project => 
    (project.tasks || []).map(task => {
      const mappedTask = {
        ...task,
        projectName: project.name || project.project_name,
        projectId: project.id || project.project_id || project.manager_id || project.created_by,
        // Ensure we have both id and task_id for compatibility
        id: task.task_id || task.id,
        task_id: task.task_id || task.id
      };
      console.log('Task mapping:', { originalTask: task, mappedTask });
      return mappedTask;
    })
  );
  
  // Get tasks from the current project if project_id is provided, otherwise use all tasks
  const currentProjectTasks = currentProject?.tasks?.map(task => {
    const mappedTask = {
      ...task,
      projectName: currentProject.name || currentProject.project_name,
      projectId: currentProject.id || currentProject.project_id || currentProject.manager_id || currentProject.created_by,
      // Ensure we have both id and task_id for compatibility
      id: task.task_id || task.id,
      task_id: task.task_id || task.id
    };
    console.log('Current project task mapping:', { originalTask: task, mappedTask });
    return mappedTask;
  }) || [];

  // Initialize local tasks when projects are loaded
  useEffect(() => {
    if (projects.length > 0 && localTasks.length === 0) {
      const initialTasks = project_id ? currentProjectTasks : allTasks;
      setLocalTasks(initialTasks);
    }
  }, [projects, project_id, currentProjectTasks, allTasks, localTasks.length]);
  
  // Use local tasks if available, otherwise use computed tasks
  const tasksBase = localTasks.length > 0 ? localTasks : (project_id ? currentProjectTasks : allTasks);

  // If current user is a developer, filter tasks to only show tasks for projects they're assigned to
  const tasks = (user && user.role === ROLES.DEVELOPER)
    ? tasksBase.filter(task => {
        const assignedToTask = (task.assigned_to || task.assignedUser || task.assigned_to_user || task.assigned_user || task.assignedTo);
        const currentUserId = user.user_id || user.userId || user.id;
        if (assignedToTask) {
          // assignedToTask might be ID or object
          const assignedId = typeof assignedToTask === 'object' ? (assignedToTask.user_id || assignedToTask.id) : assignedToTask;
          if (parseInt(assignedId) === parseInt(currentUserId)) return true;
        }
        // Otherwise, check project assignments: find project in projects store
        const project = projects.find(p => (p.id || p.project_id || p.manager_id || p.created_by) == (task.projectId || task.project_id));
        if (!project) return false;
        const assignedInProject = (project.assignments || []).some(a => (a.user?.user_id || a.user_id || a.user?.id || a.id) == currentUserId);
        return assignedInProject;
      })
    : tasksBase;

  // Filter tasks
  const filteredTasks = tasks
    .filter(task => {
      const matchesSearch = (task.title || task.task_name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (task.description || task.task_details)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (task.projectName || '')?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || task.status === statusFilter;
      const matchesProject = !projectFilter || projectFilter === 'all' || task.projectId == projectFilter;
      return matchesSearch && matchesStatus && matchesProject;
    });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, projectFilter]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleStatusUpdated = (updatedTask) => {
    // Refresh the project data to reflect the status change
    fetchProjects();
  };

  const handleAddLog = async (taskId, task) => {
    console.log('handleAddLog called with:', { taskId, task, project_id });
    setSelectedTaskForLog(task);
    setShowAddLogForm(true);
    
    // Get project_id from URL params or from task data
    const actualProjectId = project_id || task.projectId || task.project_id;
    console.log('Using project_id:', actualProjectId);
    
    // Check if project_id is available
    if (!actualProjectId) {
      console.error('project_id is undefined! Cannot fetch project with tasks.');
      showError('Project ID is missing. Please navigate to the project tasks page properly.', 'Error');
      return;
    }
    
    // Fetch the project with tasks for the modal
    try {
      console.log('Fetching project with ID:', actualProjectId);
      const response = await fetch(`/api/projects/${actualProjectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        const projectWithTasks = data.data.project || data.data;
        console.log('ViewAllTask fetched project with tasks:', projectWithTasks);
        // Store the project with tasks in state for the modal
        setSelectedProjectForLog(projectWithTasks);
      }
    } catch (error) {
      console.error('Error fetching project with tasks:', error);
    }
  };

  const handleEditTask = (e, task) => {
    e.stopPropagation(); // Prevent any parent click events
    setSelectedTaskForEdit(task);
    setShowEditTaskForm(true);
  };

  const handleViewLogs = (taskId, task) => {
    const projectId = task.projectId || project_id;
    navigate(`/project/${projectId}/task/${taskId}/logs`);
  };

  const handleViewProject = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  const handleAssignTask = (task) => {
    console.log('Assigning task:', task);
    console.log('Task project ID:', task.projectId);
    setSelectedTaskForAssign(task);
    setShowAssignTaskModal(true);
  };

  const handleTaskAssigned = async (taskId, assignedTo) => {
    try {
      console.log('Assigning task:', { taskId, assignedTo });
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assigned_to: assignedTo || null
        }),
      });

      const result = await response.json();
      console.log('Assignment response:', result);

      if (result.success) {
        const message = assignedTo ? 'Task assigned successfully!' : 'Task unassigned successfully!';
        showSuccess(message);
        
        // Update the task in local state instead of refetching all projects
        const updatedTask = result.data.task;
        setLocalTasks(prevTasks => 
          prevTasks.map(task => 
            (task.task_id || task.id) === taskId 
              ? { ...task, assignedUser: updatedTask.assignedUser, assigned_to: updatedTask.assigned_to }
              : task
          )
        );
        
        setShowAssignTaskModal(false);
        setSelectedTaskForAssign(null);
      } else {
        showError('Failed to assign task: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error assigning task:', error);
      showError('An error occurred while assigning the task');
    }
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
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 m-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading tasks</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {project_id ? `${currentProject?.name || currentProject?.project_name || 'Project'} Tasks` : 'All Tasks'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
              {project_id ? 'Manage tasks for this project' : 'View and manage all tasks across all projects'}
            </p>
          </div>
          {project_id && (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => navigate(`/project/${project_id}`)}
                className="px-4 py-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-center"
              >
                Back to Project
              </button>
              <button
                onClick={() => navigate('/tasks')}
                className="px-4 py-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-center"
              >
                View All Tasks
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tasks</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{tasks.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tasks.filter(t => t.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tasks.filter(t => t.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <ClockIconSolid className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Todo</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tasks.filter(t => t.status === 'todo').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Tasks</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              {/* Search */}
              <div className="relative flex-1 sm:flex-none">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full sm:w-64 pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">All Status</option>
                <option value="todo" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Todo</option>
                <option value="in_progress" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">In Progress</option>
                <option value="completed" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Completed</option>
              </select>

              {/* Project Filter (only show when viewing all tasks) */}
              {!project_id && (
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">All Projects</option>
                  {projects.map(project => (
                    <option 
                      key={project.id || project.project_id || project.manager_id || project.created_by} 
                      value={project.id || project.project_id || project.manager_id || project.created_by}
                      className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {project.name || project.project_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredTasks.length > 0 ? (
            <div className="space-y-4">
              {currentTasks.map(task => (
                <div key={`${task.projectId}-${task.id || task.task_id}`} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-3">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {task.title || task.task_name || 'Untitled Task'}
                          </h3>
                          {!project_id && task.projectName && (
                            <button
                              onClick={() => handleViewProject(task.projectId)}
                              className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline self-start"
                            >
                              ({task.projectName})
                            </button>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                          {task.description || task.task_details || 'No description available'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Top Right Section - Status, Progress, and Assignee */}
                    <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0">
                      {/* Status and Progress Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          Progress: {task.progress || 0}%
                        </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : task.status === 'in_progress'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                          }`}>
                            {task.status === 'completed' ? (
                              <>
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                Completed
                              </>
                            ) : task.status === 'in_progress' ? (
                              <>
                                <ClockIcon className="h-3 w-3 mr-1" />
                                In Progress
                              </>
                            ) : (
                              <>
                                <ClockIcon className="h-3 w-3 mr-1" />
                                Todo
                              </>
                            )}
                          </span>
                        </div>
                      
                       {/* Assignee Display */}
                       {task.assignedUser ? (
                         <button
                           onClick={() => handleAssignTask(task)}
                           className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                         >
                           <UserIcon className="h-4 w-4 mr-1" />
                           {task.assignedUser.name}
                         </button>
                       ) : (
                         <button
                           onClick={() => handleAssignTask(task)}
                           className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-md transition-colors"
                         >
                           <UserIcon className="h-4 w-4 mr-1" />
                           Assign
                         </button>
                       )}
                    </div>
                  </div>
                  

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleViewLogs(task.id || task.task_id, task)}
                        className="flex items-center px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                      >
                        <EyeIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden xs:inline">View </span>Logs
                      </button>
                      <button
                        onClick={() => handleAddLog(task.id || task.task_id, task)}
                        className="flex items-center px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition-colors"
                      >
                        <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden xs:inline">Add </span>Log
                      </button>
                      {canAccess([ROLES.ADMIN, ROLES.MANAGER]) && (
                        <button
                          onClick={(e) => handleEditTask(e, task)}
                          className="flex items-center px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-md transition-colors"
                        >
                          <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Edit
                        </button>
                      )}
                    </div>

                    {user?.role !== ROLES.DEVELOPER && (
                      <div className="sm:ml-auto">
                        <QuickStatusUpdate 
                          task={task} 
                          onStatusUpdated={handleStatusUpdated}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No tasks found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter || projectFilter !== 'all' ? 'No tasks match your current filters.' : 'No tasks have been created yet.'}
              </p>
            </div>
          )}

          {/* Pagination - Responsive */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTasks.length)} of {filteredTasks.length} tasks
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                
                {/* Show limited page numbers on mobile */}
                {totalPages <= 5 ? (
                  Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {page}
                    </button>
                  ))
                ) : (
                  <>
                    {/* First page */}
                    <button
                      onClick={() => handlePageChange(1)}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                        currentPage === 1
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      1
                    </button>
                    
                    {currentPage > 3 && <span className="px-1 text-gray-500">...</span>}
                    
                    {/* Current page range */}
                    {[currentPage - 1, currentPage, currentPage + 1]
                      .filter(p => p > 1 && p < totalPages)
                      .map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    
                    {currentPage < totalPages - 2 && <span className="px-1 text-gray-500">...</span>}
                    
                    {/* Last page */}
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                        currentPage === totalPages
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Log Form Modal */}
      {showAddLogForm && selectedTaskForLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Log</h2>
              <button
                onClick={() => {
            setShowAddLogForm(false);
            setSelectedTaskForLog(null);
          }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <AddLogForm
              taskId={selectedTaskForLog.id || selectedTaskForLog.task_id}
              projectId={selectedTaskForLog.projectId || project_id || selectedTaskForLog.project_id}
              project={selectedProjectForLog}
              onClose={() => {
            setShowAddLogForm(false);
            setSelectedTaskForLog(null);
            setSelectedProjectForLog(null);
                fetchProjects(); // Refresh data after adding log
          }}
        />
          </div>
        </div>
      )}

      {/* Edit Task Form Modal */}
      {showEditTaskForm && selectedTaskForEdit && (
        <EditTaskForm
          task={selectedTaskForEdit}
          projectId={selectedTaskForEdit.projectId || project_id}
          onClose={() => {
            setShowEditTaskForm(false);
            setSelectedTaskForEdit(null);
          }}
           onTaskUpdated={(responseData) => {
             // Update local tasks instead of refetching all projects
             const updatedTask = responseData.task || responseData;
             console.log('ViewAllTask - Task update received:', { responseData, updatedTask });
             
             setLocalTasks(prevTasks => {
               const newTasks = prevTasks.map(task => {
                 const taskId = task.task_id || task.id;
                 const updatedTaskId = updatedTask.task_id || updatedTask.id;
                 
                 if (taskId === updatedTaskId) {
                   const updatedTaskData = { 
                     ...task, 
                     ...updatedTask,
                     // Ensure proper field mapping for display
                     title: updatedTask.task_name || updatedTask.title,
                     task_name: updatedTask.task_name || updatedTask.title,
                     description: updatedTask.task_details || updatedTask.description,
                     task_details: updatedTask.task_details || updatedTask.description,
                     assignedUser: updatedTask.assignedUser,
                     assigned_to: updatedTask.assigned_to,
                     priority: updatedTask.priority,
                     dueDate: updatedTask.dueDate,
                     due_date: updatedTask.dueDate
                   };
                   console.log('ViewAllTask - Updating task:', { oldTask: task, newTask: updatedTaskData });
                   return updatedTaskData;
                 }
                 return task;
               });
               
               console.log('ViewAllTask - Updated local tasks:', newTasks);
               return newTasks;
             });
             
             setShowEditTaskForm(false);
             setSelectedTaskForEdit(null);
           }}
        />
      )}

      {/* Assign Task Modal */}
      {showAssignTaskModal && selectedTaskForAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Assign Task</h2>
              <button
                onClick={() => {
                  setShowAssignTaskModal(false);
                  setSelectedTaskForAssign(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>Task:</strong> {selectedTaskForAssign.title || selectedTaskForAssign.task_name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Current Assignee:</strong> {selectedTaskForAssign.assignedUser?.name || 'Unassigned'}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assign to Developer:
              </label>
              <select
                id="assignee-select"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                defaultValue={selectedTaskForAssign?.assignedUser?.user_id || ""}
              >
                <option value="">Unassign</option>
                {getProjectMembersForTask(selectedTaskForAssign?.projectId).map(user => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAssignTaskModal(false);
                  setSelectedTaskForAssign(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const select = document.getElementById('assignee-select');
                  const assignedTo = select.value;
                  const taskId = selectedTaskForAssign.id || selectedTaskForAssign.task_id;
                  console.log('Assign button clicked:', { selectedTaskForAssign, taskId, assignedTo });
                  handleTaskAssigned(taskId, assignedTo);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewAllTask;