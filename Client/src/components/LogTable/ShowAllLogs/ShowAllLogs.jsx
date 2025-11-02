import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  CalendarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useProjectStore } from '../../../store';
import { useAuthStore } from '../../../store';

const ShowAllLogs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, canAccess } = useAuthStore();
  const { projects, fetchProjects, isLoading, error } = useProjectStore();
  // Logs fetched from backend
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState(null);
  
  // Get project filter from URL query parameter
  const urlParams = new URLSearchParams(location.search);
  const projectFromUrl = urlParams.get('project');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState(projectFromUrl || 'all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    // All users can view projects they have access to
    fetchProjects();
  }, [fetchProjects]);

  // Fetch logs from backend API
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLogsLoading(true);
        setLogsError(null);
        const token = localStorage.getItem('token');
        const page = 1; // initial page
        const limit = 25; // requested page size
        const response = await fetch(`/api/logs?page=${page}&limit=${limit}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setLogs(data.data?.logs || []);
        } else {
          setLogs([]);
          setLogsError(data.message || 'Failed to load logs');
        }
      } catch (e) {
        setLogsError('Failed to load logs');
        setLogs([]);
      } finally {
        setLogsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Update project filter when URL changes
  useEffect(() => {
    if (projectFromUrl) {
      setProjectFilter(projectFromUrl);
    }
  }, [projectFromUrl]);

  // Helper to parse dd/mm/yyyy to Date
  const parseLogDate = (ddmmyyyy) => {
    if (!ddmmyyyy) return null;
    const [day, month, year] = ddmmyyyy.split('/').map(Number);
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day);
  };

  // Helper to convert "2h 30m" => 2.5 hours
  const parseFormattedTimeToHours = (formatted) => {
    if (!formatted || typeof formatted !== 'string') return 0;
    const match = formatted.trim().match(/^(\d+)h\s*(\d+)m$/i);
    if (!match) return 0;
    const hours = parseInt(match[1], 10) || 0;
    const minutes = parseInt(match[2], 10) || 0;
    return hours + (minutes / 60);
  };

  // Adapt logs from API into unified shape used by UI
  const allLogs = logs.map((log) => {
    const derivedHours = (typeof log.totalHours === 'number' && !Number.isNaN(log.totalHours))
      ? log.totalHours
      : parseFormattedTimeToHours(log.formattedTime);
    return ({
      id: log.log_id,
      description: log.logdata,
      hours: derivedHours,
      formattedTime: log.formattedTime,
      logDate: log.log_date, // dd/mm/yyyy
      createdAt: log.log_date, // keep field name for minimal UI change
      userName: log.user?.name,
      userId: log.user?.user_id,
      projectName: log.project?.project_name || log.project?.projectName,
      projectId: log.project?.project_id,
      taskName: log.task?.task_name || log.task?.taskName,
      taskId: log.task?.task_id
    });
  });

  // Filter logs based on user's assigned projects (for employees and managers)
  const userFilteredLogs = useMemo(() => {
    if (!user || !user.role) return allLogs;
    
    // Admin sees all logs
    if (user.role === 'admin') return allLogs;
    
    // For managers and developers, only show logs from their assigned projects
    const assignedProjectIds = projects.map(p => p.project_id || p.id);
    return allLogs.filter(log => assignedProjectIds.includes(log.projectId));
  }, [allLogs, projects, user]);

  // Filter logs
  const filteredLogs = userFilteredLogs
    .filter(log => {
      const matchesSearch = (log.description || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (log.projectName || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (log.taskName || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (log.userName || '')?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProject = !projectFilter || projectFilter === 'all' || log.projectId == projectFilter;
      
      // Date filtering using dd/mm/yyyy
      let matchesDate = true;
      if (dateFilter !== 'all' && log.logDate) {
        const logDate = parseLogDate(log.logDate);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const thisWeek = new Date(today);
        thisWeek.setDate(thisWeek.getDate() - 7);
        const thisMonth = new Date(today);
        thisMonth.setMonth(thisMonth.getMonth() - 1);

        switch (dateFilter) {
          case 'today':
            matchesDate = logDate && logDate.toDateString() === today.toDateString();
            break;
          case 'yesterday':
            matchesDate = logDate && logDate.toDateString() === yesterday.toDateString();
            break;
          case 'this_week':
            matchesDate = logDate && logDate >= thisWeek;
            break;
          case 'this_month':
            matchesDate = logDate && logDate >= thisMonth;
            break;
        }
      }
      
      return matchesSearch && matchesProject && matchesDate;
    })
    .sort((a, b) => {
      const aDate = parseLogDate(a.logDate) || new Date(0);
      const bDate = parseLogDate(b.logDate) || new Date(0);
      return bDate - aDate; // newest first
    });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, projectFilter, dateFilter]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleViewProject = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  const handleViewTask = (projectId, taskId) => {
    navigate(`/project/${projectId}/task/${taskId}/logs`);
  };

  const formatDuration = (hours) => {
    if (!hours) return '0h';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Convert to hh:mm using formattedTime if present, else from hours
  const toHHMM = (log) => {
    if (log.formattedTime) {
      const match = /^(\d+)h\s+(\d+)m$/.exec(log.formattedTime.trim());
      if (match) {
        const h = String(parseInt(match[1], 10)).padStart(2, '0');
        const m = String(parseInt(match[2], 10)).padStart(2, '0');
        return `${h}:${m}`;
      }
    }
    const totalHours = log.hours || 0;
    const totalMinutes = Math.max(0, Math.round(totalHours * 60));
    const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const m = String(totalMinutes % 60).padStart(2, '0');
    return `${h}:${m}`;
  };

  if (isLoading || logsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || logsError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 m-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading logs</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">{error || logsError}</div>
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
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {projectFilter !== 'all' ? 
                `Logs - ${projects.find(p => {
                  const pId = p.id || p.project_id || p.manager_id || p.created_by;
                  return pId == projectFilter;
                })?.name || projects.find(p => {
                  const pId = p.id || p.project_id || p.manager_id || p.created_by;
                  return pId == projectFilter;
                })?.project_name || 'Project'}` : 
                'All Logs'
              }
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
              {projectFilter !== 'all' ? 
                `View and manage time logs for this project` : 
                'View and manage all time logs across all projects'
              }
            </p>
          </div>
          {projectFilter !== 'all' && (
            <button
              onClick={() => {
                setProjectFilter('all');
                navigate('/logs');
              }}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors self-start"
            >
              View All Logs
            </button>
          )}
        </div>

        {/* Stats - Show stats based on filtered logs (assigned projects only for employees/managers) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Logs</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{userFilteredLogs.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <ClockIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Hours</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDuration(userFilteredLogs.reduce((total, log) => total + (parseFormattedTimeToHours(log.formattedTime) || log.hours || 0), 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <UserIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Users</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Set(userFilteredLogs.map(log => log.userId || log.user_id)).size}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Projects</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Set(userFilteredLogs.map(log => log.projectId)).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4 sm:mb-6">
        <div className="p-3 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Logs</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              {/* Search */}
              <div className="relative flex-1 sm:flex-none">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full sm:w-64 pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Project Filter */}
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

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">All Time</option>
                <option value="today" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Today</option>
                <option value="yesterday" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Yesterday</option>
                <option value="this_week" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">This Week</option>
                <option value="this_month" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">This Month</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-6">
          {filteredLogs.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {currentLogs.map((log, index) => (
                <div key={`${log.projectId}-${log.taskId}-${log.id || index}`} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-600">
                  {/* Top row: description left, duration + user right */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                    <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                          {log.description || 'No description'}
                        </h3>
                        {/* Aligned under description: clickable Task / Project */}
                        <div className="mt-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
                          <span className="truncate">Task: {log.taskName ? (
                            <button
                              onClick={() => handleViewTask(log.projectId, log.taskId)}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {log.taskName}
                            </button>
                          ) : 'Unknown Task'}</span>
                          <span className="truncate">Project: {log.projectName ? (
                            <button
                              onClick={() => handleViewProject(log.projectId)}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {log.projectName}
                            </button>
                          ) : 'Unknown Project'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm flex-wrap sm:flex-nowrap">
                      <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold tracking-wide whitespace-nowrap">
                        {log.formattedTime || toHHMM(log)}
                      </span>
                      <div className="flex items-center text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-400" />
                        <span className="truncate max-w-[120px] sm:max-w-none">{log.userName || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom row: left actions, right log date */}
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewTask(log.projectId, log.taskId)}
                        className="flex items-center px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                      >
                        <EyeIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        View Task Logs
                      </button>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {log.logDate || 'Unknown date'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No logs found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || projectFilter !== 'all' || dateFilter !== 'all' ? 'No logs match your current filters.' : 'No logs have been created yet.'}
              </p>
            </div>
          )}

          {/* Pagination - Responsive */}
          {totalPages > 1 && (
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredLogs.length)} of {filteredLogs.length} logs
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                
                {/* Smart pagination for mobile */}
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
    </div>
  );
};

export default ShowAllLogs;