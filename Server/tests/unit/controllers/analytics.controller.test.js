const analyticsController = require('../../../src/controllers/analytics.controller');
const { Project, Task, Log, User, Assignment } = require('../../../src/models');

jest.mock('../../../src/models');
jest.mock('../../../src/utils/logger');

describe('Analytics Controller - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
      user: { user_id: 1, email: 'test@test.com' }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getDashboardAnalytics', () => {
    it('should return dashboard analytics', async () => {
      const mockProjects = [
        { status: 'in_progress' },
        { status: 'completed' }
      ];

      const mockTasks = [
        { status: 'completed' },
        { status: 'in_progress' },
        { status: 'todo' }
      ];

      const mockLogs = [
        { logstatus: 'approved', start_time: '09:00:00', end_time: '12:00:00' },
        { logstatus: 'pending', start_time: '13:00:00', end_time: '17:00:00' }
      ];

      Project.findAll = jest.fn().mockResolvedValue(mockProjects);
      Task.findAll = jest.fn().mockResolvedValue(mockTasks);
      Log.findAll = jest.fn().mockResolvedValue(mockLogs);
      User.count = jest.fn().mockResolvedValue(10);

      await analyticsController.getDashboardAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          analytics: expect.objectContaining({
            projects: expect.any(Object),
            tasks: expect.any(Object),
            logs: expect.any(Object),
            team: expect.any(Object)
          })
        }
      });
    });

    it('should filter logs by date range', async () => {
      req.query = {
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      };

      Project.findAll = jest.fn().mockResolvedValue([]);
      Task.findAll = jest.fn().mockResolvedValue([]);
      Log.findAll = jest.fn().mockResolvedValue([]);
      User.count = jest.fn().mockResolvedValue(0);

      await analyticsController.getDashboardAnalytics(req, res);

      expect(Log.findAll).toHaveBeenCalledWith({
        where: expect.objectContaining({
          created_at: expect.any(Object)
        })
      });
    });
  });

  describe('getProjectAnalytics', () => {
    it('should return project-wise analytics', async () => {
      const mockProjects = [
        {
          project_id: 1,
          project_name: 'Project 1',
          status: 'in_progress',
          createdAt: new Date(),
          tasks: [
            { status: 'completed', logs: [] },
            { status: 'in_progress', logs: [] }
          ],
          assignments: [
            { user: { user_id: 1 } },
            { user: { user_id: 2 } }
          ]
        }
      ];

      Project.findAll = jest.fn().mockResolvedValue(mockProjects);

      await analyticsController.getProjectAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          projects: expect.arrayContaining([
            expect.objectContaining({
              project_id: 1,
              totalTasks: 2,
              completedTasks: 1,
              teamSize: 2
            })
          ])
        }
      });
    });
  });

  describe('getUserAnalytics', () => {
    it('should return user-wise analytics', async () => {
      const mockUsers = [
        {
          user_id: 1,
          name: 'User 1',
          email: 'user1@test.com',
          role: 'developer',
          createdTasks: [
            { status: 'completed' },
            { status: 'in_progress' }
          ],
          logs: [
            { start_time: '09:00:00', end_time: '12:00:00' }
          ]
        }
      ];

      User.findAll = jest.fn().mockResolvedValue(mockUsers);

      await analyticsController.getUserAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          users: expect.arrayContaining([
            expect.objectContaining({
              user_id: 1,
              totalTasks: 2,
              completedTasks: 1,
              totalLogs: 1
            })
          ])
        }
      });
    });
  });

  describe('getTimelineAnalytics', () => {
    it('should return timeline analytics', async () => {
      req.query = {
        startDate: '2025-01-01',
        endDate: '2025-01-02'
      };

      Project.count = jest.fn().mockResolvedValue(1);
      Task.count = jest.fn().mockResolvedValue(2);
      Log.count = jest.fn().mockResolvedValue(3);

      await analyticsController.getTimelineAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          timeline: expect.any(Array)
        }
      });
    });

    it('should return 400 if date range not provided', async () => {
      req.query = {};

      await analyticsController.getTimelineAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getPerformanceAnalytics', () => {
    it('should return performance analytics', async () => {
      const mockTasks = [
        {
          task_id: 1,
          task_name: 'Task 1',
          status: 'completed',
          estimate_time: '8:00',
          logs: [
            { start_time: '09:00:00', end_time: '17:00:00' }
          ]
        }
      ];

      Task.findAll = jest.fn().mockResolvedValue(mockTasks);

      await analyticsController.getPerformanceAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          tasks: expect.any(Array),
          overall: expect.objectContaining({
            totalTasks: 1,
            completedTasks: 1
          })
        }
      });
    });
  });
});

