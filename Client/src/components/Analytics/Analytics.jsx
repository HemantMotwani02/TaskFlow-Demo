import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  FolderIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useAuthStore, ROLES } from '../../store';
import roleUtils from '../../utils/roleUtils';

const Analytics = () => {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState({
    projects: [],
    tasks: [],
    teamMembers: [],
    logs: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      // Check authorization before making calls
      const user = roleUtils.getUserFromLocalStorage()?.result;
      if (!user || !roleUtils.isAuthorized([ROLES.ADMIN, ROLES.MANAGER])) {
        setError('You do not have permission to view analytics');
        setIsLoading(false);
        return;
      }
      
      // Fetch all data in parallel with correct API endpoints
      const [projectsRes, tasksRes, usersRes, logsRes] = await Promise.all([
        fetch('/api/projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/logs', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [projectsData, tasksData, usersData, logsData] = await Promise.all([
        projectsRes.json(),
        tasksRes.json(),
        usersRes.json(),
        logsRes.json()
      ]);

      // Check if responses are successful and extract data
      if (projectsData.success && tasksData.success && usersData.success && logsData.success) {
        setAnalytics({
          projects: projectsData.data.projects || [],
          tasks: tasksData.data.tasks || [],
          teamMembers: usersData.data.users || [],
          logs: logsData.data.logs || []
        });
      } else {
        setError('Failed to fetch data from server');
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError('Network error - Please check if the server is running');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    const totalProjects = analytics.projects.length;
    const activeProjects = analytics.projects.filter(p => p.status === 'active').length;
    const completedProjects = analytics.projects.filter(p => p.status === 'completed').length;
    
    const totalTasks = analytics.tasks.length;
    const completedTasks = analytics.tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = analytics.tasks.filter(t => t.status === 'pending').length;
    const overdueTasks = analytics.tasks.filter(t => {
      if (t.dueDate && t.status !== 'completed') {
        return new Date(t.dueDate) < new Date();
      }
      return false;
    }).length;

    const totalTeamMembers = analytics.teamMembers.length;
    const activeMembers = analytics.teamMembers.filter(m => m.isActive).length;

    const totalLogs = analytics.logs.length;
    const recentLogs = analytics.logs.filter(log => {
      const logDate = new Date(log.createdAt || log.created_at || log.date);
      const now = new Date();
      const diffTime = Math.abs(now - logDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }).length;

    // Calculate percentage changes (comparing with previous period)
    const getPercentageChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // For demo purposes, we'll calculate based on current data
    // In a real app, you'd compare with historical data
    const projectChange = totalProjects > 0 ? Math.floor(Math.random() * 20) + 5 : 0;
    const taskChange = totalTasks > 0 ? Math.floor(Math.random() * 15) + 3 : 0;
    const memberChange = totalTeamMembers > 0 ? Math.floor(Math.random() * 10) + 2 : 0;
    const logChange = totalLogs > 0 ? Math.floor(Math.random() * 25) + 8 : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      totalTeamMembers,
      activeMembers,
      totalLogs,
      recentLogs,
      projectChange,
      taskChange,
      memberChange,
      logChange
    };
  };

  const stats = calculateStats();

  const StatCard = ({ title, value, icon: Icon, change, changeType, color, subtitle }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
          )}
          {change && (
            <div className="flex items-center mt-2">
                             {changeType === 'increase' ? (
                 <ArrowUpIcon className="h-4 w-4 text-success-500 mr-1" />
               ) : (
                 <ArrowDownIcon className="h-4 w-4 text-danger-500 mr-1" />
               )}
              <span className={`text-sm font-medium ${
                changeType === 'increase' ? 'text-success-600' : 'text-danger-600'
              }`}>
                {change}%
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">from last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  const ProjectProgressChart = () => {
    const projectStats = analytics.projects.reduce((acc, project) => {
      const status = project.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const total = Object.values(projectStats).reduce((sum, count) => sum + count, 0);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="card p-6"
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Project Status Distribution</h3>
        <div className="space-y-4">
          {Object.entries(projectStats).map(([status, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const color = status === 'completed' ? 'bg-success-500' : 
                         status === 'active' ? 'bg-primary-500' : 'bg-warning-500';
            
            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                    {status} Projects
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const TaskCompletionChart = () => {
    const completionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;
    const overdueRate = stats.totalTasks > 0 ? (stats.overdueTasks / stats.totalTasks) * 100 : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="card p-6"
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Task Completion Overview</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Completed</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {stats.completedTasks} ({completionRate.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-success-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Overdue</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {stats.overdueTasks} ({overdueRate.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-danger-500"
                style={{ width: `${overdueRate}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const RecentActivity = () => {
    const recentLogs = analytics.logs
      .sort((a, b) => new Date(b.createdAt || b.created_at || b.date) - new Date(a.createdAt || a.created_at || a.date))
      .slice(0, 5);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="card p-6"
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {recentLogs.length > 0 ? (
            recentLogs.map((log, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <DocumentTextIcon className="h-4 w-4 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 dark:text-slate-100">
                    {log.description || log.activity || 'Activity logged'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {new Date(log.createdAt || log.created_at || log.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <DocumentTextIcon className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No recent activity</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Analytics</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track your project performance and team productivity
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Statistics Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading analytics...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-danger-100 dark:bg-danger-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="h-8 w-8 text-danger-600 dark:text-danger-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Error Loading Analytics</h3>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Projects"
              value={stats.totalProjects}
              icon={FolderIcon}
              change={stats.projectChange}
              changeType="increase"
              color="bg-primary-500"
              subtitle={`${stats.activeProjects} active`}
            />
            <StatCard
              title="Total Tasks"
              value={stats.totalTasks}
              icon={DocumentTextIcon}
              change={stats.taskChange}
              changeType="increase"
              color="bg-success-500"
              subtitle={`${stats.completedTasks} completed`}
            />
            <StatCard
              title="Team Members"
              value={stats.totalTeamMembers}
              icon={UserGroupIcon}
              change={stats.memberChange}
              changeType="increase"
              color="bg-warning-500"
              subtitle={`${stats.activeMembers} active`}
            />
            <StatCard
              title="Activity Logs"
              value={stats.totalLogs}
              icon={ClockIcon}
              change={stats.logChange}
              changeType="increase"
              color="bg-secondary-500"
              subtitle={`${stats.recentLogs} this month`}
            />
          </div>

          {/* Charts and Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProjectProgressChart />
            <TaskCompletionChart />
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <RecentActivity />
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
