import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UserGroupIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useProjectStore } from '../../store';
import { useTaskStore } from '../../store';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useAuthStore } from '../../store';
import { apiCall } from '../../store';
import { format, subDays } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Brush
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();
  const { tasks, fetchTasks } = useTaskStore();
  const navigate = useNavigate();

  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = subDays(end, 30);
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd')
    };
  });

  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState({
    dashboard: null,
    projects: [],
    timeline: [],
    prev: null
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [isTimelineFullscreen, setIsTimelineFullscreen] = useState(false);
  const [isKanbanFullscreen, setIsKanbanFullscreen] = useState(false);
  const [selectedKanbanProject, setSelectedKanbanProject] = useState('');
  const [perProjectAnalytics, setPerProjectAnalytics] = useState({});
  const [kanbanTasks, setKanbanTasks] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    teamMembers: 0,
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    // Fetch tasks for all projects when projects are loaded
    if (projects.length > 0) {
      projects.forEach(project => {
        fetchTasks(project.id);
      });
    }
  }, [projects]);

  // Fetch analytics for charts
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }).toString();

      // Also compute previous period for deltas
      const startDateObj = new Date(dateRange.startDate);
      const endDateObj = new Date(dateRange.endDate);
      const rangeDays = Math.max(1, Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)));
      const prevEnd = new Date(startDateObj);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - rangeDays + 1);
      const prevParams = new URLSearchParams({
        startDate: format(prevStart, 'yyyy-MM-dd'),
        endDate: format(prevEnd, 'yyyy-MM-dd')
      }).toString();

      const [dashRes, projRes, timeRes, logsRes, prevDashRes] = await Promise.all([
        apiCall(`/analytics/dashboard?${params}`),
        apiCall(`/analytics/projects?${params}`),
        apiCall(`/analytics/timeline?${params}`),
        apiCall(`/logs?${new URLSearchParams({ page: '1', limit: '8' }).toString()}`),
        apiCall(`/analytics/dashboard?${prevParams}`)
      ]);

      const next = { dashboard: null, projects: [], timeline: [], prev: null };
      if (dashRes.success && dashRes.data.success) next.dashboard = dashRes.data.data.analytics;
      if (projRes.success && projRes.data.success) next.projects = projRes.data.data.projects;
      if (timeRes.success && timeRes.data.success) next.timeline = timeRes.data.data.timeline;
      if (prevDashRes.success && prevDashRes.data.success) next.prev = prevDashRes.data.data.analytics;
      setAnalytics(next);

      if (logsRes.success && logsRes.data.success) {
        let logs = logsRes.data.data.logs || [];
        // For employees/managers, filter logs by assigned projects
        if (user && (user.role === 'developer' || user.role === 'manager')) {
          const assignedProjectIds = projects.map(p => p.project_id || p.id);
          logs = logs.filter(log => 
            assignedProjectIds.includes(log.project?.project_id || log.project_id)
          );
        }
        setRecentLogs(logs);
      } else {
        setRecentLogs([]);
      }
      setLoading(false);
    };

    fetchAnalytics();
  }, [dateRange.startDate, dateRange.endDate]);

  // Fetch per-project analytics to power adherence variance
  useEffect(() => {
    const fetchPerProject = async () => {
      if (!projects || projects.length === 0) return;
      const limited = projects.slice(0, 20); // avoid too many requests
      const results = await Promise.all(limited.map(p => apiCall(`/projects/${p.id || p.project_id}/analytics`)));
      const map = {};
      results.forEach((res, idx) => {
        const p = limited[idx];
        if (res.success && res.data.success) {
          map[p.id || p.project_id] = res.data.data.analytics;
        }
      });
      setPerProjectAnalytics(map);
    };
    fetchPerProject();
  }, [projects]);

  // Fetch Kanban tasks based on selected project
  // When projects load, default to the first project if none selected
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedKanbanProject) {
      const firstId = (projects[0].id || projects[0].project_id);
      if (firstId) setSelectedKanbanProject(firstId.toString());
    }
  }, [projects]);

  useEffect(() => {
    const fetchKanbanTasks = async () => {
      if (!selectedKanbanProject) {
        setKanbanTasks([]);
        return;
      }

      const res = await apiCall(`/projects/${selectedKanbanProject}/tasks`);
      if (res.success && res.data.success) {
        let arr = (res.data.data?.tasks || []).map(task => ({
          ...task,
          task_id: task.task_id || task.id,
          task_name: task.task_name || task.name,
          id: task.task_id || task.id
        }));
        
        // For employees, filter to only show tasks assigned to them
        if (user && user.role === 'developer') {
          arr = arr.filter(task => {
            const assignedUserId = task.assigned_user_id || task.assignedUserId || task.assigned_to;
            return assignedUserId === user.user_id || assignedUserId === user.id;
          });
        }
        
        setKanbanTasks(arr);
      } else {
        setKanbanTasks([]);
      }
    };

    fetchKanbanTasks();
  }, [selectedKanbanProject, user]);

  useEffect(() => {
    // Populate top stat cards using analytics if available; fall back to derived
    // For employees/managers, filter by assigned projects
    const assignedProjectIds = projects.map(p => p.project_id || p.id);
    
    if (analytics.dashboard) {
      // If employee/manager, recalculate stats based on assigned projects only
      if (user && (user.role === 'developer' || user.role === 'manager')) {
        // projects array is already filtered by store for employees
        setStats({
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === 'active' || p.status === 'in-progress').length,
          completedTasks: tasks.filter(t => 
            assignedProjectIds.includes(t.project_id || t.projectId) && t.status === 'completed'
          ).length,
          pendingTasks: tasks.filter(t => 
            assignedProjectIds.includes(t.project_id || t.projectId) && (t.status === 'pending' || t.status === 'in-progress')
          ).length,
          overdueTasks: tasks.filter(t => {
            const isAssigned = assignedProjectIds.includes(t.project_id || t.projectId);
            if (t.due_date && t.status !== 'completed' && isAssigned) {
              return new Date(t.due_date) < new Date();
            }
            return false;
          }).length,
          teamMembers: analytics.dashboard.team?.totalMembers || 0,
        });
      } else {
        // Admin sees all
        setStats({
          totalProjects: analytics.dashboard.projects.total,
          activeProjects: analytics.dashboard.projects.active,
          completedTasks: analytics.dashboard.tasks.completed,
          pendingTasks: analytics.dashboard.tasks.pending,
          overdueTasks: tasks.filter(t => {
            if (t.dueDate && t.status !== 'completed') {
              return new Date(t.dueDate) < new Date();
            }
            return false;
          }).length,
          teamMembers: analytics.dashboard.team?.totalMembers || 0,
        });
      }
      return;
    }

    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const overdueTasks = tasks.filter(t => {
      if (t.dueDate && t.status !== 'completed') {
        return new Date(t.dueDate) < new Date();
      }
      return false;
    }).length;

    setStats({
      totalProjects,
      activeProjects,
      completedTasks,
      pendingTasks,
      overdueTasks,
      teamMembers: 0,
    });
  }, [analytics.dashboard, projects, tasks]);

  // Compute deltas vs previous period
  const deltas = useMemo(() => {
    const formatDelta = (curr, prev) => {
      const p = prev || 0;
      if (p === 0) return curr > 0 ? 100 : 0; // treat as 100% up if new
      return Math.round(((curr - p) / p) * 100);
    };
    if (!analytics.dashboard || !analytics.prev) return {
      projects: 0,
      active: 0,
      completedTasks: 0,
      overdueTasks: 0
    };
    return {
      projects: formatDelta(analytics.dashboard.projects.total, analytics.prev.projects.total),
      active: formatDelta(analytics.dashboard.projects.active, analytics.prev.projects.active),
      completedTasks: formatDelta(analytics.dashboard.tasks.completed, analytics.prev.tasks.completed),
      overdueTasks: formatDelta(stats.overdueTasks, 0) // we don't have prev overdue from API; fallback
    };
  }, [analytics.dashboard, analytics.prev, stats.overdueTasks]);

  const timelineChartData = useMemo(() => {
    return (analytics.timeline || []).map(item => ({
      date: item.date.slice(5),
      Projects: item.projects,
      Tasks: item.tasks,
      Logs: item.logs
    }));
  }, [analytics.timeline]);

  const statusPieData = useMemo(() => {
    // Build status buckets from analytics.projects
    const buckets = analytics.projects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [analytics.projects]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const StatCard = ({ title, value, icon: Icon, change, changeType, color, bgColor }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
          {typeof change === 'number' && (
            <div className="flex items-center">
              {change >= 0 ? (
                <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {Math.abs(change)}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">from last month</span>
            </div>
          )}
        </div>
                 <div className={`p-3 rounded-lg ${bgColor} dark:bg-opacity-20`}>
           <Icon className={`h-6 w-6 ${color}`} />
         </div>
      </div>
    </div>
  );

  const RecentActivity = ({ activities }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        <button onClick={() => navigate('/logs')} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200">
          View all
        </button>
      </div>
      <div className="space-y-3">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                <activity.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <ClockIcon className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No recent activity</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Start creating projects and tasks to see activity here</p>
          </div>
        )}
      </div>
    </div>
  );

  const QuickActions = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <button className="flex flex-col items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-all duration-200 group">
          <PlusIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform duration-200" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">New Project</span>
        </button>
        <button className="flex flex-col items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-all duration-200 group">
          <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform duration-200" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Add Member</span>
        </button>
        <button className="flex flex-col items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-all duration-200 group">
          <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform duration-200" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Schedule Meeting</span>
        </button>
        <button className="flex flex-col items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-all duration-200 group">
          <CheckCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform duration-200" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Create Task</span>
        </button>
      </div>
    </div>
  );

  const ProjectProgress = () => {
    const recentProjects = projects.slice(0, 5);
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Project Progress</h3>
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200">
            View all
          </button>
        </div>
        <div className="space-y-4">
          {recentProjects.length > 0 ? (
            recentProjects.map((project) => {
              const projectTasks = tasks.filter(t => t.projectId === project.id);
              const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
              const totalTasks = projectTasks.length;
              const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
              
              return (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{project.name}</h4>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{completedTasks} of {totalTasks} tasks completed</span>
                    <span className="capitalize">{project.status}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6">
              <FolderIcon className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No projects found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first project to get started</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Recent activity from logs API
  const activities = useMemo(() => {
    const items = (recentLogs || []).map(log => ({
      description: `${log.user?.name || 'Someone'} logged work on ${log.task?.task_name || 'a task'}`,
      time: new Date(log.created_at || Date.now()).toLocaleString(),
      icon: CheckCircleIcon
    }));
    if (items.length > 0) return items;

    // Fallback to local synthetic activity
    const fallback = [];
    projects.slice(0, 3).forEach(project => {
      fallback.push({
        description: `Project "${project.name}" created`,
        time: new Date(project.createdAt || Date.now()).toLocaleDateString(),
        icon: FolderIcon,
      });
    });
    return fallback;
  }, [recentLogs, projects]);

  // Kanban data
  const filteredTasks = useMemo(() => {
    return kanbanTasks;
  }, [kanbanTasks]);

  const kanbanColumns = useMemo(() => {
    return {
      pending: filteredTasks.filter(t => (t.status || '').toLowerCase() === 'pending' || (t.status || '').toLowerCase() === 'todo'),
      in_progress: filteredTasks.filter(t => (t.status || '').toLowerCase() === 'in_progress' || (t.status || '').toLowerCase() === 'in progress'),
      completed: filteredTasks.filter(t => (t.status || '').toLowerCase() === 'completed')
    };
  }, [filteredTasks]);

  const [kanbanOrder, setKanbanOrder] = useState({
    pending: [],
    in_progress: [],
    completed: []
  });

  useEffect(() => {
    setKanbanOrder({
      pending: kanbanColumns.pending.map(t => t.id || t.task_id),
      in_progress: kanbanColumns.in_progress.map(t => t.id || t.task_id),
      completed: kanbanColumns.completed.map(t => t.id || t.task_id)
    });
  }, [kanbanColumns]);

  const onDragEnd = (result) => {
    console.debug('🛑 onDragEnd result:', result);
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const startCol = source.droppableId;
    const endCol = destination.droppableId;

    const newOrder = { ...kanbanOrder };
    // Remove from start
    const startItems = Array.from(newOrder[startCol]);
    startItems.splice(source.index, 1);
    newOrder[startCol] = startItems;
    // Insert into end
    const endItems = Array.from(newOrder[endCol]);
    endItems.splice(destination.index, 0, draggableId);
    newOrder[endCol] = endItems;
    setKanbanOrder(newOrder);

    // Update local task status immediately so UI stays consistent
    const statusMap = {
      pending: 'pending',
      in_progress: 'in_progress',
      completed: 'completed'
    };
    const newStatus = statusMap[endCol] || endCol;

    setKanbanTasks(prev => prev.map(task => {
      if ((task.id || task.task_id).toString() === draggableId.toString()) {
        return { ...task, status: newStatus };
      }
      return task;
    }));

    // Persist change to backend (best-effort, don't block UI)
    (async () => {
      try {
        await apiCall(`/tasks/${draggableId}`, {
          method: 'PUT',
          body: JSON.stringify({ status: newStatus })
        });
      } catch (e) {
        console.warn('Failed to persist task status change', e);
      }
    })();
  };

  // Small helper component to render a column's Droppable + Draggables and log lifecycle
  const DroppableColumn = ({ col }) => {
    useEffect(() => {
      console.debug('📦 Droppable mount:', col.key);
      return () => {
        console.debug('🗑️ Droppable unmount:', col.key);
      };
    }, [col.key]);

    return (
      <Droppable droppableId={String(col.key)} key={col.key}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="rounded-md bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 p-3 h-full">
            <div className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400 font-semibold mb-2">{col.title}</div>
            <div className="space-y-2 h-[calc(100%-2rem)] overflow-auto pr-1">
              {kanbanColumns[col.key].map((t, index) => {
                if (!t) return null;
                const idStr = (t.id || t.task_id).toString();
                return (
                  <Draggable key={idStr} draggableId={idStr} index={index}>
                    {(dragProvided) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 select-none touch-none cursor-grab active:cursor-grabbing"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{t.task_name || t.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t.projectName || projects.find(p => (p.id === t.projectId || p.project_id === t.project_id))?.name || 'Project'}</div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
              {kanbanOrder[col.key].length === 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">No tasks</div>
              )}
            </div>
          </div>
        )}
      </Droppable>
    );
  };

  // Project adherence categorization
  const adherence = useMemo(() => {
    const now = new Date();
    const projectIdToTasks = tasks.reduce((acc, t) => {
      const pid = t.projectId || t.project_id;
      if (!pid) return acc;
      acc[pid] = acc[pid] || [];
      acc[pid].push(t);
      return acc;
    }, {});

    let ahead = 0, onTrack = 0, behind = 0;
    Object.entries(projectIdToTasks).forEach(([pid, list]) => {
      const total = list.length;
      const completed = list.filter(t => (t.status || '').toLowerCase() === 'completed').length;
      const overdue = list.filter(t => t.dueDate && (t.status || '').toLowerCase() !== 'completed' && new Date(t.dueDate) < now).length;

      if (overdue > 0) behind += 1;
      else if (completed / Math.max(1, total) >= 0.8) ahead += 1;
      else onTrack += 1;
    });
    return { ahead, onTrack, behind };
  }, [tasks]);

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-full overflow-x-hidden">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 text-white shadow-sm mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <ChartBarIcon className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold mb-1">
              Welcome back, {user?.name || 'User'}! 👋
            </h1>
            <p className="text-blue-100 text-sm">
              Here's what's happening with your projects today.
            </p>
          </div>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Analytics range</div>
          <div className="flex items-center gap-3">
            <select
              className="text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1 text-gray-700 dark:text-gray-200"
              onChange={(e) => {
                const val = e.target.value;
                const end = new Date();
                let start;
                if (val === '7') start = subDays(end, 7);
                else if (val === '30') start = subDays(end, 30);
                else if (val === '90') start = subDays(end, 90);
                else return; // custom controlled by inputs below
                setDateRange({ startDate: format(start, 'yyyy-MM-dd'), endDate: format(end, 'yyyy-MM-dd') });
              }}
              defaultValue="30"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="custom">Custom</option>
            </select>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(r => ({ ...r, startDate: e.target.value }))}
              className="text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1 text-gray-700 dark:text-gray-200"
            />
            <span className="text-gray-500 dark:text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(r => ({ ...r, endDate: e.target.value }))}
              className="text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1 text-gray-700 dark:text-gray-200"
            />
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Projects"
          value={stats.totalProjects}
          icon={FolderIcon}
          change={deltas.projects}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatCard
          title="Active Projects"
          value={stats.activeProjects}
          icon={ClockIcon}
          change={deltas.active}
          color="text-yellow-600 dark:text-yellow-400"
          bgColor="bg-yellow-100 dark:bg-yellow-900/30"
        />
        <StatCard
          title="Completed Tasks"
          value={stats.completedTasks}
          icon={CheckCircleIcon}
          change={deltas.completedTasks}
          color="text-green-600 dark:text-green-400"
          bgColor="bg-green-100 dark:bg-green-900/30"
        />
        <StatCard
          title="Overdue Tasks"
          value={stats.overdueTasks}
          icon={ExclamationTriangleIcon}
          change={-Math.abs(deltas.overdueTasks)}
          color="text-red-600 dark:text-red-400"
          bgColor="bg-red-100 dark:bg-red-900/30"
        />
      </div>

      {/* Charts Row - Hide for employees */}
      {user && user.role !== 'developer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* New Projects Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New items over time</h3>
            <div className="flex items-center gap-3">
              {loading && <span className="text-xs text-gray-500">Loading...</span>}
              <button
                className="text-xs px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60"
                onClick={() => setIsTimelineFullscreen(true)}
              >
                Fullscreen
              </button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Projects" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Tasks" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Logs" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Brush dataKey="date" height={20} stroke="#8884d8" travellerWidth={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
          {/* Project Status Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project status</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Adherence */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
        {/* Timeline Adherence per Project (interactive) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timeline adherence</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projects.map(p => {
                  const pid = p.id || p.project_id;
                  const a = perProjectAnalytics[pid];
                  const variance = a ? Math.round(a.timeVariance) : 0; // positive means over estimate
                  // Categorize using variance
                  const ahead = variance < -10 ? 1 : 0; // >10% faster
                  const behind = variance > 10 ? 1 : 0; // >10% slower
                  const onTrack = ahead === 0 && behind === 0 ? 1 : 0;
                  return { name: p.name || p.project_name, variance, Ahead: ahead, 'On Track': onTrack, Behind: behind };
                })}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" interval={0} tick={{ fontSize: 10 }} angle={-20} dy={10} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                {/* Show variance as line for clarity */}
                {/* <Line type="monotone" dataKey="variance" stroke="#8b5cf6" dot={false} /> */}
                <Bar dataKey="Ahead" stackId="a" fill="#10b981" />
                <Bar dataKey="On Track" stackId="a" fill="#3b82f6" />
                <Bar dataKey="Behind" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        </div>
        
      {/* Kanban - Full Row */}
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Kanban</h3>
              <select
                className="text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1 text-gray-700 dark:text-gray-200"
                value={selectedKanbanProject}
                onChange={(e) => setSelectedKanbanProject(e.target.value)}
              >
                {projects.map(p => (
                  <option key={p.id || p.project_id} value={(p.id || p.project_id).toString()}>{p.name || p.project_name}</option>
                ))}
              </select>
            </div>
            <button
              className="text-xs px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60"
              onClick={() => setIsKanbanFullscreen(true)}
            >
              Fullscreen
            </button>
          </div>
          {!isKanbanFullscreen && (
            <DragDropContext onDragEnd={onDragEnd} onDragStart={(s)=>{console.debug('🟢 drag start',s);}} onDragUpdate={(u)=>{console.debug('🟡 drag update',u);}}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { key: 'pending', title: 'To Do' },
                  { key: 'in_progress', title: 'In Progress' },
                  { key: 'completed', title: 'Completed' }
                ].map(col => (
                  <DroppableColumn col={col} key={col.key} />
                ))}
              </div>
            </DragDropContext>
          )}
        </div>
      </div>

      {/* Fullscreen Kanban Modal */}
      {isKanbanFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-11/12 h-5/6 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Kanban</h3>
                <select
                  className="text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1 text-gray-700 dark:text-gray-200"
                  value={selectedKanbanProject}
                  onChange={(e) => setSelectedKanbanProject(e.target.value)}
                >
                  {projects.map(p => (
                    <option key={p.id || p.project_id} value={(p.id || p.project_id).toString()}>{p.name || p.project_name}</option>
                  ))}
                </select>
              </div>
              <button
                className="text-sm px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => setIsKanbanFullscreen(false)}
              >
                Close
              </button>
            </div>
            <div className="flex-1">
                <DragDropContext onDragEnd={onDragEnd} onDragStart={(s)=>{console.debug('🟢 drag start',s);}} onDragUpdate={(u)=>{console.debug('🟡 drag update',u);}}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                  {[
                    { key: 'pending', title: 'To Do' },
                    { key: 'in_progress', title: 'In Progress' },
                    { key: 'completed', title: 'Completed' }
                  ].map(col => (
                    <DroppableColumn col={col} key={col.key} />
                  ))}
          </div>
        </DragDropContext>
      </div>
          </div>
        </div>
      )}

      {/* Recent Activity at bottom */}
      <div className="mb-6">
        <RecentActivity activities={activities} />
      </div>

      {/* Fullscreen Modal for Timeline */}
      {isTimelineFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-11/12 h-5/6 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New items over time</h3>
              <button
                className="text-sm px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => setIsTimelineFullscreen(false)}
              >
                Close
              </button>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Projects" fill="#3b82f6" />
                  <Bar dataKey="Tasks" fill="#10b981" />
                  <Bar dataKey="Logs" fill="#f59e0b" />
                  <Brush dataKey="date" height={20} stroke="#8884d8" travellerWidth={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
      </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
