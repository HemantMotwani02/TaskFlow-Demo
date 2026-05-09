const logController = require('../../../src/controllers/log.controller');
const { Log, Task, Project, User } = require('../../../src/models');

jest.mock('../../../src/models');
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/notification.service');

describe('Log Controller - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
      user: { user_id: 1, email: 'test@test.com', role: 'developer' }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAllLogs', () => {
    it('should return all logs with pagination', async () => {
      const mockLogs = [
        { log_id: 1, logdata: 'Work log 1', toJSON: jest.fn().mockReturnValue({ log_id: 1 }) },
        { log_id: 2, logdata: 'Work log 2', toJSON: jest.fn().mockReturnValue({ log_id: 2 }) }
      ];

      Log.findAndCountAll = jest.fn().mockResolvedValue({
        count: 2,
        rows: mockLogs
      });

      req.query = { page: 1, limit: 10 };

      await logController.getAllLogs(req, res);

      expect(Log.findAndCountAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          logs: expect.any(Array),
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1
          }
        }
      });
    });

    it('should filter logs by task', async () => {
      req.query = { taskId: '1', page: 1, limit: 10 };

      Log.findAndCountAll = jest.fn().mockResolvedValue({
        count: 1,
        rows: []
      });

      await logController.getAllLogs(req, res);

      const callArgs = Log.findAndCountAll.mock.calls[0][0];
      expect(callArgs.where).toHaveProperty('task_id', '1');
    });
  });

  describe('getLogById', () => {
    it('should return log by ID', async () => {
      const mockLog = {
        log_id: 1,
        logdata: 'Test log'
      };

      Log.findByPk = jest.fn().mockResolvedValue(mockLog);

      req.params.id = 1;

      await logController.getLogById(req, res);

      expect(Log.findByPk).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { log: mockLog }
      });
    });

    it('should return 404 if log not found', async () => {
      Log.findByPk = jest.fn().mockResolvedValue(null);

      req.params.id = 999;

      await logController.getLogById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createLog', () => {
    it('should create a new log', async () => {
      const mockLog = {
        log_id: 1,
        task_id: 1,
        project_id: 1,
        logdata: 'New log'
      };

      Task.findByPk = jest.fn().mockResolvedValue({ task_id: 1, task_name: 'Test Task' });
      Project.findByPk = jest.fn().mockResolvedValue({ project_id: 1, manager_id: 2 });
      Log.create = jest.fn().mockResolvedValue(mockLog);

      req.body = {
        taskId: 1,
        projectId: 1,
        logdata: 'New log',
        start_time: '09:00:00',
        end_time: '17:00:00'
      };

      await logController.createLog(req, res);

      expect(Log.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if task not found', async () => {
      Task.findByPk = jest.fn().mockResolvedValue(null);

      req.body = {
        taskId: 999,
        projectId: 1,
        logdata: 'New log'
      };

      await logController.createLog(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateLog', () => {
    it('should update own log', async () => {
      const mockLog = {
        log_id: 1,
        user_id: 1,
        logdata: 'Old data',
        update: jest.fn().mockResolvedValue(true)
      };

      Log.findByPk = jest.fn().mockResolvedValue(mockLog);

      req.params.id = 1;
      req.body = {
        logdata: 'New data',
        start_time: '09:00:00',
        end_time: '17:00:00'
      };

      await logController.updateLog(req, res);

      expect(mockLog.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Log updated successfully',
        data: { log: mockLog }
      });
    });

    it('should return 403 if trying to update someone elses log', async () => {
      const mockLog = {
        log_id: 1,
        user_id: 2  // Different user
      };

      Log.findByPk = jest.fn().mockResolvedValue(mockLog);

      req.params.id = 1;
      req.body = { logdata: 'New data' };

      await logController.updateLog(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteLog', () => {
    it('should delete own log', async () => {
      const mockLog = {
        log_id: 1,
        user_id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      Log.findByPk = jest.fn().mockResolvedValue(mockLog);
      req.user.role = 'admin';
      req.params.id = 1;

      await logController.deleteLog(req, res);

      expect(mockLog.destroy).toHaveBeenCalled();
    });
  });

  describe('approveLog', () => {
    it('should approve a log', async () => {
      const mockLog = {
        log_id: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      Log.findByPk = jest.fn().mockResolvedValue(mockLog);

      req.params.id = 1;

      await logController.approveLog(req, res);

      expect(mockLog.update).toHaveBeenCalledWith({
        approved_by: 1,
        logstatus: 'approved'
      });
    });
  });

  describe('rejectLog', () => {
    it('should reject a log with reason', async () => {
      const mockLog = {
        log_id: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      Log.findByPk = jest.fn().mockResolvedValue(mockLog);

      req.params.id = 1;
      req.body = { reason: 'Incorrect hours' };

      await logController.rejectLog(req, res);

      expect(mockLog.update).toHaveBeenCalledWith({
        approved_by: 1,
        logstatus: 'rejected',
        rejection_reason: 'Incorrect hours'
      });
    });
  });

  describe('getLogAnalytics', () => {
    it('should return log analytics', async () => {
      const mockLogs = [
        { log_id: 1, logstatus: 'approved', start_time: '09:00:00', end_time: '12:00:00' },
        { log_id: 2, logstatus: 'pending', start_time: '13:00:00', end_time: '17:00:00' }
      ];

      Log.findAll = jest.fn().mockResolvedValue(mockLogs);

      req.query = { projectId: 1 };

      await logController.getLogAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          analytics: expect.objectContaining({
            total: 2,
            approved: 1,
            pending: 1
          })
        }
      });
    });
  });
});

