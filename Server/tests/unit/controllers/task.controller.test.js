const taskController = require('../../../src/controllers/task.controller');
const { Task, Project, User, Log } = require('../../../src/models');

jest.mock('../../../src/models');
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/notification.service');

describe('Task Controller - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
      user: { user_id: 1, email: 'test@example.com' }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAllTasks', () => {
    it('should return all tasks with pagination', async () => {
      const mockTasks = [
        { task_id: 1, task_name: 'Task 1', status: 'todo' },
        { task_id: 2, task_name: 'Task 2', status: 'in_progress' }
      ];

      Task.findAndCountAll = jest.fn().mockResolvedValue({
        count: 2,
        rows: mockTasks
      });

      req.query = { page: 1, limit: 10 };

      await taskController.getAllTasks(req, res);

      expect(Task.findAndCountAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          tasks: mockTasks,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1
          }
        }
      });
    });

    it('should filter tasks by status', async () => {
      req.query = { status: 'completed', page: 1, limit: 10 };

      Task.findAndCountAll = jest.fn().mockResolvedValue({
        count: 1,
        rows: []
      });

      await taskController.getAllTasks(req, res);

      const callArgs = Task.findAndCountAll.mock.calls[0][0];
      expect(callArgs.where).toHaveProperty('status', 'completed');
    });
  });

  describe('getTaskById', () => {
    it('should return task by ID', async () => {
      const mockTask = {
        task_id: 1,
        task_name: 'Test Task',
        status: 'todo'
      };

      Task.findByPk = jest.fn().mockResolvedValue(mockTask);

      req.params.id = 1;

      await taskController.getTaskById(req, res);

      expect(Task.findByPk).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTask
      });
    });

    it('should return 404 if task not found', async () => {
      Task.findByPk = jest.fn().mockResolvedValue(null);

      req.params.id = 999;

      await taskController.getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const mockTask = {
        task_id: 1,
        task_name: 'New Task',
        status: 'todo',
        project_id: 1,
        created_by: 1
      };

      Project.findByPk = jest.fn().mockResolvedValue({ project_id: 1 });
      Task.create = jest.fn().mockResolvedValue(mockTask);

      req.body = {
        task_name: 'New Task',
        task_details: 'Details',
        status: 'todo',
        projectId: 1
      };

      await taskController.createTask(req, res);

      expect(Task.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Task created successfully',
        data: { task: mockTask }
      });
    });

    it('should return 400 if project not found', async () => {
      Project.findByPk = jest.fn().mockResolvedValue(null);

      req.body = {
        task_name: 'New Task',
        projectId: 999
      };

      await taskController.createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', async () => {
      const mockTask = {
        task_id: 1,
        task_name: 'Old Name',
        update: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockResolvedValue(true)
      };

      Task.findByPk = jest.fn().mockResolvedValue(mockTask);

      req.params.id = 1;
      req.body = {
        task_name: 'New Name',
        status: 'in_progress'
      };

      await taskController.updateTask(req, res);

      expect(mockTask.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Task updated successfully',
        data: { task: mockTask }
      });
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      const mockTask = {
        task_id: 1,
        task_name: 'Test Task',
        destroy: jest.fn().mockResolvedValue(true)
      };

      Task.findByPk = jest.fn().mockResolvedValue(mockTask);

      req.params.id = 1;

      await taskController.deleteTask(req, res);

      expect(mockTask.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Task deleted successfully'
      });
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status', async () => {
      const mockTask = {
        task_id: 1,
        task_name: 'Test Task',
        status: 'todo',
        update: jest.fn().mockResolvedValue(true)
      };

      Task.findByPk = jest.fn().mockResolvedValue(mockTask);

      req.params.id = 1;
      req.body = { status: 'completed' };

      await taskController.updateTaskStatus(req, res);

      expect(mockTask.update).toHaveBeenCalledWith({
        status: 'completed',
        updated_by: req.user.user_id
      });
    });
  });

  describe('getTaskAnalytics', () => {
    it('should return task analytics', async () => {
      const mockTasks = [
        { task_id: 1, status: 'completed' },
        { task_id: 2, status: 'in_progress' },
        { task_id: 3, status: 'pending' }
      ];

      Task.findAll = jest.fn().mockResolvedValue(mockTasks);

      req.query = { projectId: 1 };

      await taskController.getTaskAnalytics(req, res);

      expect(Task.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          analytics: expect.objectContaining({
            total: 3,
            completed: 1,
            inProgress: 1,
            pending: 1
          })
        }
      });
    });
  });
});

