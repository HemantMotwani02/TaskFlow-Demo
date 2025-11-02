import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store';
import { useAuthStore } from '../../store';
import { 
  ArrowLeftIcon,
  ClockIcon,
  UserIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const ProjectReport = () => {
  const { projectId, project_id } = useParams();
  const actualProjectId = projectId || project_id;
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, fetchProjects, isLoading, error } = useProjectStore();
  
  const [currentProject, setCurrentProject] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (!projects || projects.length === 0) {
      fetchProjects();
    }
  }, [fetchProjects, projects]);

  useEffect(() => {
    if (projects && projects.length > 0) {
      const project = projects.find(p => {
        const pId = p.id || p.project_id || p.manager_id || p.created_by;
        return pId == actualProjectId;
      });
      
      if (project) {
        setCurrentProject(project);
        fetchProjectLogs(project);
      }
    }
  }, [projects, actualProjectId]);

  const fetchProjectLogs = async (project) => {
    try {
      setLogsLoading(true);
      const token = localStorage.getItem('token');
      
      // Validate project ID before making the API call
      const projectIdToUse = project?.project_id || project?.id || actualProjectId;
      
      if (!projectIdToUse) {
        console.error('No valid project ID found for fetching logs');
        setLogs([]);
        generateReportData(project, []);
        return;
      }
      
      // Fetch all logs for this project (backend max limit is 100, so fetch in batches)
      let allLogs = [];
      let page = 1;
      let hasMoreLogs = true;
      
      while (hasMoreLogs) {
        const response = await fetch(`/api/logs?project_id=${projectIdToUse}&page=${page}&limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to fetch logs:', errorData.message || response.statusText);
          break;
        }
        
        const data = await response.json();
        
        if (data.success && data.data.logs) {
          allLogs = [...allLogs, ...data.data.logs];
          
          // Check if there are more pages
          const pagination = data.data.pagination;
          if (pagination && pagination.page < pagination.pages) {
            page++;
          } else {
            hasMoreLogs = false;
          }
        } else {
          hasMoreLogs = false;
        }
      }
      
      // Set the fetched logs
      setLogs(allLogs);
      generateReportData(project, allLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs([]);
      generateReportData(project, []);
    } finally {
      setLogsLoading(false);
    }
  };

  const generateReportData = (project, projectLogs = []) => {
    // Use the fetched logs directly and calculate duration
    const allLogs = projectLogs.map(log => {
      // Calculate duration from start_time and end_time if duration is not provided
      let duration = log.duration || 0;
      
      if (!duration && log.start_time && log.end_time) {
        try {
          // Ensure times have seconds component
          const startWithSeconds = log.start_time.includes(':') && log.start_time.split(':').length === 2 
            ? `${log.start_time}:00` 
            : log.start_time;
          const endWithSeconds = log.end_time.includes(':') && log.end_time.split(':').length === 2 
            ? `${log.end_time}:00` 
            : log.end_time;
          
          const start = new Date(`2000-01-01T${startWithSeconds}`);
          const end = new Date(`2000-01-01T${endWithSeconds}`);
          const diffMs = end - start;
          
          // Convert to minutes
          duration = Math.round(diffMs / (1000 * 60));
        } catch (error) {
          console.error('Error calculating duration:', error);
          duration = 0;
        }
      }
      
      return {
        ...log,
        taskName: log.task_name || log.taskName || 'Unknown Task',
        taskId: log.task_id || log.taskId,
        userName: log.user_name || log.userName || log.user?.name || 'Unknown User',
        userId: log.user_id || log.userId || log.user?.id,
        duration: duration,
        createdAt: log.createdAt || log.created_at || log.log_date
      };
    });

    // Calculate user billing data
    const userBilling = {};
    allLogs.forEach(log => {
      const userName = log.userName;
      const duration = log.duration || 0;
      
      if (!userBilling[userName]) {
        userBilling[userName] = {
          totalHours: 0,
          totalMinutes: 0,
          logs: 0,
          tasks: new Set()
        };
      }
      
      userBilling[userName].totalMinutes += duration;
      userBilling[userName].totalHours += duration / 60;
      userBilling[userName].logs += 1;
      userBilling[userName].tasks.add(log.taskId);
    });

    // Convert to array and calculate task counts
    const userBillingArray = Object.entries(userBilling).map(([userName, data]) => ({
      userName,
      totalHours: Math.round(data.totalHours * 100) / 100,
      totalMinutes: data.totalMinutes,
      logs: data.logs,
      tasks: data.tasks.size
    }));

    // Calculate task status distribution
    const taskStatuses = project.tasks?.reduce((acc, task) => {
      const status = task.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Calculate daily activity (last 30 days)
    const dailyActivity = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    allLogs.forEach(log => {
      const logDate = new Date(log.createdAt || log.created_at);
      if (logDate >= thirtyDaysAgo) {
        const dateKey = logDate.toISOString().split('T')[0];
        dailyActivity[dateKey] = (dailyActivity[dateKey] || 0) + (log.duration || 0);
      }
    });

    // Calculate project progress
    const totalTasks = project.tasks?.length || 0;
    const completedTasks = project.tasks?.filter(task => task.status === 'completed').length || 0;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate total project hours
    const totalProjectHours = allLogs.reduce((total, log) => total + (log.duration || 0), 0) / 60;

    setReportData({
      userBilling: userBillingArray,
      taskStatuses,
      dailyActivity,
      totalTasks,
      completedTasks,
      progressPercentage,
      totalProjectHours: Math.round(totalProjectHours * 100) / 100,
      totalLogs: allLogs.length,
      uniqueUsers: userBillingArray.length
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatHours = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'todo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  if (isLoading || logsLoading) {
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
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading report</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProject || !reportData) {
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

  return (
    <div className="p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        {/* Back Button */}
        <div className="mb-1">
          <button
            onClick={() => navigate(`/project/${actualProjectId}`)}
            className="flex items-center px-3 py-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Project
          </button>
        </div>
        
        {/* Project Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Project Report - {currentProject.name || currentProject.project_name || 'Unnamed Project'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Comprehensive analytics and billing overview
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Hours</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatHours(reportData.totalProjectHours)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {reportData.uniqueUsers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Logs</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {reportData.totalLogs}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Progress</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {reportData.progressPercentage}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Billing Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Billing Hours</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Hours logged by each team member</p>
          </div>
          <div className="p-6">
            {reportData.userBilling.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {reportData.userBilling
                  .sort((a, b) => b.totalHours - a.totalHours)
                  .map((user, index) => (
                    <div key={user.userName} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {user.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.userName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user.tasks} tasks • {user.logs} logs
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatHours(user.totalHours)}
                        </p>
                        <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ 
                              width: `${Math.min((user.totalHours / Math.max(...reportData.userBilling.map(u => u.totalHours))) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No billing data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Task Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Task Status Distribution</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Current status of all project tasks</p>
          </div>
          <div className="p-6">
            {Object.keys(reportData.taskStatuses).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(reportData.taskStatuses)
                  .sort(([,a], [,b]) => b - a)
                  .map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(status)}`}>
                          {status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{count}</p>
                        <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(count / reportData.totalTasks) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No tasks available</p>
              </div>
            )}
          </div>
        </div>

        {/* Daily Activity Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Daily Activity (Last 30 Days)</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Hours logged per day</p>
          </div>
          <div className="p-6">
            {Object.keys(reportData.dailyActivity).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(reportData.dailyActivity)
                  .sort(([a], [b]) => new Date(a) - new Date(b))
                  .slice(-14) // Show last 14 days
                  .map(([date, minutes]) => (
                    <div key={date} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(date).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDuration(minutes)}
                        </span>
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ 
                              width: `${Math.min((minutes / Math.max(...Object.values(reportData.dailyActivity))) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No activity data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Project Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Project Progress</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overall completion status</p>
          </div>
          <div className="p-6">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-40 h-40">
                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 144 144" style={{ overflow: 'visible' }}>
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 64}`}
                    strokeDashoffset={`${2 * Math.PI * 64 * (1 - reportData.progressPercentage / 100)}`}
                    className="text-blue-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {reportData.progressPercentage}%
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {reportData.completedTasks} of {reportData.totalTasks} tasks completed
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {reportData.totalProjectHours} hours logged
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectReport;
