import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store';
import { useAuthStore, ROLES } from '../../store';
import toastService from '../../utils/toastService';
import { 
  ArrowLeftIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ChartBarIcon,
  EyeIcon,
  PlusIcon,
  PencilIcon,
  Cog6ToothIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import AddTaskForm from '../Tasks/AddTaskForm';
import AddLogForm from '../Tasks/AddLogForm';
import EditTaskForm from '../Tasks/EditTaskForm';
import ManageProjectTeam from './ManageProjectTeam';

const ProjectDetails = () => {
  const { projectId, project_id } = useParams();
  const actualProjectId = projectId || project_id;
  const navigate = useNavigate();
  const { user, canAccess } = useAuthStore();
  const { projects, fetchProjects, deleteProject, isLoading, error } = useProjectStore();
  
  // Function to fetch a single project by ID
  const fetchSingleProject = React.useCallback(async (id) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      console.log('ProjectDetails fetchSingleProject response:', data);
      if (data.success && data.data) {
        let project = data.data.project || data.data;
        
        // Transform assignments into team array with assignment_id (like in store)
        if (project && project.assignments) {
          const team = project.assignments.map(assignment => ({
            user_id: assignment.user?.user_id,
            id: assignment.user?.user_id,
            name: assignment.user?.name,
            email: assignment.user?.email,
            role: assignment.user?.role || assignment.role,
            assigned_at: assignment.assigned_at,
            assignment_id: assignment.assignment_id || assignment.id
          }));
          project = { ...project, team };
        }
        
        console.log('ProjectDetails fetched project:', project);
        console.log('ProjectDetails project tasks:', project?.tasks);
        console.log('ProjectDetails project team:', project?.team);
        return project;
      }
      return null;
    } catch (error) {
      console.error('Error fetching single project:', error);
      return null;
    }
  }, []);
  
  const [currentProject, setCurrentProject] = useState(null);
  const [isFetchingIndividual, setIsFetchingIndividual] = useState(false);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [showAddLogForm, setShowAddLogForm] = useState(false);
  const [selectedTaskForLog, setSelectedTaskForLog] = useState(null);
  const [showEditTaskForm, setShowEditTaskForm] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null);
  const [showManageTeam, setShowManageTeam] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Always fetch the individual project to get complete data including team members
    if (actualProjectId) {
      setIsFetchingIndividual(true);
      fetchSingleProject(actualProjectId).then(fetchedProject => {
        setIsFetchingIndividual(false);
        if (fetchedProject) {
          console.log('Successfully fetched project with team data:', fetchedProject);
          console.log('Team members found:', fetchedProject.team?.length || 0);
          console.log('Team data:', fetchedProject.team);
          console.log('Tasks found:', fetchedProject.tasks?.length || 0);
          console.log('Tasks data:', fetchedProject.tasks);
          setCurrentProject(fetchedProject);
          // Post-fetch authorization check: prevent developers (employees) from viewing projects
          // they are not assigned to. Admins and managers are allowed (managers may be limited elsewhere).
          const currentUser = user;
          try {
            if (currentUser && currentUser.role === ROLES.DEVELOPER) {
              const assigned = (fetchedProject.assignments || []).some(a => (a.user?.user_id || a.user_id || a.id) === (currentUser.user_id || currentUser.userId || currentUser.id));
              if (!assigned) {
                toastService.showError('You do not have access to view this project', 'Access denied');
                navigate('/projects');
              }
            }
          } catch (err) {
            // swallow errors from this guard; server will enforce authorization
            console.warn('Authorization guard error:', err);
          }
        } else {
          console.log('Failed to fetch project individually');
          setCurrentProject(null);
        }
      });
    }
  }, [actualProjectId, fetchSingleProject]);

  // Remove the complex project finding logic since we're always fetching individual project

  if (isLoading || isFetchingIndividual) {
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
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading project</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Project not found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          The project you're looking for doesn't exist or has been removed.
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  // Calculate project statistics
  const totalTasks = currentProject.tasks?.length || 0;
  const completedTasks = currentProject.tasks?.filter(task => task.status === 'completed').length || 0;
  const inProgressTasks = currentProject.tasks?.filter(task => task.status === 'in_progress').length || 0;
  const todoTasks = currentProject.tasks?.filter(task => task.status === 'todo').length || 0;
  
  // Calculate total logged hours
  const totalLoggedHours = currentProject.tasks?.reduce((total, task) => {
    return total + (task.logs?.reduce((taskTotal, log) => taskTotal + (log.duration || 0), 0) || 0);
  }, 0) || 0;

  // Get all logs for this project
  const allProjectLogs = currentProject.tasks?.flatMap(task => 
    (task.logs || []).map(log => ({
      ...log,
      taskName: task.task_name || task.title,
      taskId: task.task_id || task.id
    }))
  ) || [];

  // Sort logs by date (most recent first)
  const sortedLogs = allProjectLogs.sort((a, b) => 
    new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)
  );

  // Get recent logs (last 5)
  const recentLogs = sortedLogs.slice(0, 5);

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleEditTask = (e, task) => {
    e.stopPropagation(); // Prevent any parent click events
    setSelectedTaskForEdit(task);
    setShowEditTaskForm(true);
  };

  const handleAddTask = () => {
    setShowAddTaskForm(true);
  };

  const handleAddLog = (taskId, task) => {
    setSelectedTaskForLog({ taskId, task });
    setShowAddLogForm(true);
  };

  const handleTeamUpdated = (updatedProject) => {
    setCurrentProject(updatedProject);
    // Also refresh the individual project data to ensure we have the latest team information
    fetchSingleProject(actualProjectId).then(fetchedProject => {
      if (fetchedProject) {
        setCurrentProject(fetchedProject);
      }
    });
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setIsUpdatingStatus(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/projects/${actualProjectId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update the current project with new status
        setCurrentProject(prev => ({
          ...prev,
          status: newStatus
        }));
        setShowStatusUpdate(false);
        console.log('Project status updated successfully');
      } else {
        console.error('Failed to update project status:', data.message);
        alert('Failed to update project status: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating project status:', error);
      alert('Error updating project status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteProject(actualProjectId);
      
      if (result.success) {
        // Navigate back to projects list after successful deletion
        navigate('/projects');
      } else {
        alert('Failed to delete project: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="p-6 overflow-y-auto">
             {/* Header */}
       <div className="mb-6">
                   {/* Back Button */}
          <div className="mb-1">
            <button
              onClick={() => navigate('/projects')}
              className="flex items-center px-3 py-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Projects
            </button>
          </div>
         
         {/* Project Title and Actions */}
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
               {currentProject.name || currentProject.project_name || 'Unnamed Project'}
             </h1>
             <p className="text-gray-600 dark:text-gray-300 mt-1">
               {currentProject.description || currentProject.project_details || 'No description available'}
             </p>
           </div>
           
             <div className="flex flex-col items-end space-y-2">
             {/* Delete Button - Above other buttons */}
             {canAccess([ROLES.ADMIN]) && (
               <button
                 onClick={() => setShowDeleteConfirm(true)}
                 className="w-8 h-8 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full flex items-center justify-center transition-colors"
                 title="Delete Project"
               >
                 <TrashIcon className="h-4 w-4" />
               </button>
             )}
             
             {/* Other Action Buttons - Responsive layout */}
             <div className="flex flex-wrap items-center gap-2">
               {/* For admin/manager show report button; for developers, replace with Add Task when assigned */}
               {user?.role === ROLES.DEVELOPER ? (
                 // Developers: if assigned to the project, allow Add Task; otherwise, don't show report or add-task
                 ((currentProject?.assignments || []).some(a => (a.user?.user_id || a.user_id || a.user?.id || a.id) == (user.user_id || user.id || user.userId))) ? (
                   <>
                     <button
                       onClick={() => setShowAddTaskForm(true)}
                       className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm whitespace-nowrap"
                     >
                       <PlusIcon className="h-4 w-4 mr-1.5 inline" />
                       <span className="hidden sm:inline">Add Task</span>
                       <span className="sm:hidden">Task</span>
                     </button>
                     <button
                       onClick={() => setShowAddLogForm(true)}
                       className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors text-sm whitespace-nowrap"
                     >
                       <ClockIcon className="h-4 w-4 mr-1.5 inline" />
                       <span className="hidden sm:inline">Add Log</span>
                       <span className="sm:hidden">Log</span>
                     </button>
                   </>
                 ) : (
                   // Not assigned: show nothing (guard will redirect if they navigated directly)
                   null
                 )
               ) : (
                 // Admins and managers keep existing behavior
                 <>
                   <button
                     onClick={() => navigate(`/project/${actualProjectId}/report`)}
                     className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-sm whitespace-nowrap"
                   >
                     <ChartBarIcon className="h-4 w-4 mr-1.5 inline" />
                     <span className="hidden sm:inline">View Report</span>
                     <span className="sm:hidden">Report</span>
                   </button>
                   <button
                     onClick={() => setShowAddLogForm(true)}
                     className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors text-sm whitespace-nowrap"
                   >
                     <ClockIcon className="h-4 w-4 mr-1.5 inline" />
                     <span className="hidden sm:inline">Add Log</span>
                     <span className="sm:hidden">Log</span>
                   </button>
                   {canAccess([ROLES.ADMIN, ROLES.MANAGER]) && (
                     <button
                       onClick={() => setShowAddTaskForm(true)}
                       className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm whitespace-nowrap"
                     >
                       <PlusIcon className="h-4 w-4 mr-1.5 inline" />
                       <span className="hidden sm:inline">Add Task</span>
                       <span className="sm:hidden">Task</span>
                     </button>
                   )}
                 </>
               )}
             </div>
           </div>
         </div>
       </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tasks</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Progress</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{currentProject.progress || 0}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Logged Hours</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatDuration(totalLoggedHours)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Team Members</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {currentProject.team?.length || 1}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Project Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Status</label>
                  {canAccess([ROLES.ADMIN, ROLES.MANAGER]) ? (
                    <button
                      onClick={() => setShowStatusUpdate(true)}
                      className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(currentProject.status)} hover:opacity-80 transition-opacity cursor-pointer`}
                      title="Click to update status"
                    >
                      {currentProject.status || 'Unknown'}
                    </button>
                  ) : (
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(currentProject.status)}`}>
                      {currentProject.status || 'Unknown'}
                    </span>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Manager</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {currentProject.manager?.name || 'Unassigned'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Created Date</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {currentProject.createdAt ? new Date(currentProject.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Last Updated</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {currentProject.updatedAt ? new Date(currentProject.updatedAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tasks Overview</h2>
                <button
                  onClick={() => navigate(`/project/${actualProjectId}/tasks`)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                >
                  View All Tasks
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completedTasks}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgressTasks}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{todoTasks}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">To Do</div>
                </div>
              </div>
              
              {/* Recent Tasks */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Tasks</h3>
                {currentProject.tasks && currentProject.tasks.length > 0 ? (
                  <div className="space-y-3">
                    {currentProject.tasks.slice(0, 5).map((task) => (
                      <div key={task.task_id || task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {task.task_name || task.title || 'Unnamed Task'}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {task.task_details || task.description || 'No description'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                          <button
                            onClick={() => navigate(`/project/${actualProjectId}/tasks`)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            title="View Tasks"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {canAccess([ROLES.ADMIN, ROLES.MANAGER]) && (
                            <button
                              onClick={(e) => handleEditTask(e, task)}
                              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                              title="Edit Task"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No tasks found for this project.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Members */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Members</h2>
                {canAccess([ROLES.ADMIN, ROLES.MANAGER]) && (
                  <button
                    onClick={() => setShowManageTeam(true)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                    title="Manage Team"
                  >
                    <Cog6ToothIcon className="h-4 w-4 mr-1" />
                    Manage Team
                  </button>
                )}
              </div>
            </div>
            <div className="p-6">
              {currentProject.team && currentProject.team.length > 0 ? (
                <div className="space-y-3">
                  {currentProject.team.map((member) => (
                    <div key={member.user_id || member.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {member.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <UserGroupIcon className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No team members assigned</p>
                </div>
              )}
            </div>
          </div>

                     {/* Recent Logs */}
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
             <div className="p-6 border-b border-gray-200 dark:border-gray-700">
               <div className="flex items-center justify-between">
                 <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Logs</h2>
                 <button
                   onClick={() => navigate(`/logs?project=${actualProjectId}`)}
                   className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                 >
                   View All Logs
                 </button>
               </div>
             </div>
             <div className="p-6">
               {recentLogs.length > 0 ? (
                 <div className="space-y-3">
                   {recentLogs.map((log) => (
                     <div key={log.log_id || log.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                       <div className="flex-shrink-0">
                         <ClockIcon className="h-4 w-4 text-blue-500 mt-0.5" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                           {log.taskName || 'Unknown Task'}
                         </p>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                           {log.description || log.log_details || 'No description'}
                         </p>
                         <div className="flex items-center justify-between mt-2">
                           <span className="text-xs text-gray-500 dark:text-gray-400">
                             {formatDuration(log.duration || 0)}
                           </span>
                           <span className="text-xs text-gray-500 dark:text-gray-400">
                             {log.createdAt || log.created_at ? new Date(log.createdAt || log.created_at).toLocaleDateString() : 'Unknown'}
                           </span>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-4">
                   <ClockIcon className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                   <p className="text-sm text-gray-500 dark:text-gray-400">No logs found for this project</p>
                 </div>
               )}
             </div>
           </div>

           {/* Recent Activity */}
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
             <div className="p-6 border-b border-gray-200 dark:border-gray-700">
               <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
             </div>
             <div className="p-6">
               <div className="space-y-4">
                 <div className="flex items-start space-x-3">
                   <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                   <div>
                     <p className="text-sm text-gray-900 dark:text-white">Project created</p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">
                       {currentProject.createdAt ? new Date(currentProject.createdAt).toLocaleDateString() : 'Unknown'}
                     </p>
                   </div>
                 </div>
                 
                 {currentProject.tasks && currentProject.tasks.length > 0 && (
                   <div className="flex items-start space-x-3">
                     <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                     <div>
                       <p className="text-sm text-gray-900 dark:text-white">{totalTasks} tasks added</p>
                       <p className="text-xs text-gray-500 dark:text-gray-400">Project tasks</p>
                     </div>
                   </div>
                 )}
                 
                 {totalLoggedHours > 0 && (
                   <div className="flex items-start space-x-3">
                     <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                     <div>
                       <p className="text-sm text-gray-900 dark:text-white">{formatDuration(totalLoggedHours)} logged</p>
                       <p className="text-xs text-gray-500 dark:text-gray-400">Total time tracked</p>
                     </div>
                   </div>
                 )}
               </div>
             </div>
           </div>
                 </div>
       </div>

       {/* Add Task Form Modal */}
       {showAddTaskForm && (
         <AddTaskForm
           projectId={actualProjectId}
           onClose={() => setShowAddTaskForm(false)}
           onTaskAdded={(newTask) => {
             // Refresh the project data
             fetchProjects();
             setShowAddTaskForm(false);
           }}
         />
       )}

       {/* Add Log Form Modal */}
       {showAddLogForm && (
         <>
           {console.log('ProjectDetails rendering AddLogForm with:', {
             projectId: actualProjectId,
             currentProject,
             projectTasks: currentProject?.tasks,
             tasksCount: currentProject?.tasks?.length || 0
           })}
           <AddLogForm
             projectId={actualProjectId}
             project={currentProject}
             onClose={() => {
               setShowAddLogForm(false);
               setSelectedTaskForLog(null);
             }}
             onLogAdded={(newLog) => {
               // Refresh the project data
               fetchSingleProject(actualProjectId).then(fetchedProject => {
                 if (fetchedProject) {
                   setCurrentProject(fetchedProject);
                 }
               });
               setShowAddLogForm(false);
               setSelectedTaskForLog(null);
             }}
           />
         </>
       )}

       {/* Edit Task Form Modal */}
       {showEditTaskForm && selectedTaskForEdit && (
         <EditTaskForm
           task={selectedTaskForEdit}
           projectId={actualProjectId}
           onClose={() => {
             setShowEditTaskForm(false);
             setSelectedTaskForEdit(null);
           }}
           onTaskUpdated={(updatedTask) => {
             // Refresh the project data
             fetchProjects();
             setShowEditTaskForm(false);
             setSelectedTaskForEdit(null);
           }}
         />
       )}

               {/* Manage Project Team Modal */}
        {showManageTeam && currentProject && (
          <ManageProjectTeam
            project={currentProject}
            onClose={() => setShowManageTeam(false)}
            onTeamUpdated={handleTeamUpdated}
          />
        )}

        {/* Status Update Modal */}
        {showStatusUpdate && currentProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 text-lg font-semibold">📊</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Update Project Status</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {currentProject.name || currentProject.project_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStatusUpdate(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Current Status: <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(currentProject.status)}`}>
                      {currentProject.status || 'Unknown'}
                    </span>
                  </label>
                  
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Select New Status
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(status)}
                        disabled={isUpdatingStatus || status === currentProject.status}
                        className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                          status === currentProject.status
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-500 dark:hover:border-blue-400'
                        } ${getStatusColor(status)}`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {isUpdatingStatus && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Updating status...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && currentProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <TrashIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Project</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Are you sure you want to delete the project <strong className="text-gray-900 dark:text-white">
                      "{currentProject.name || currentProject.project_name}"
                    </strong>?
                  </p>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Warning</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          This will soft delete the project. It will be hidden from the project list but can be restored by an administrator.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteProject}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete Project
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
     </div>
   );
 };

export default ProjectDetails;
