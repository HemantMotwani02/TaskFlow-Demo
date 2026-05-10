const projectController = require('../../../src/controllers/project.controller');
const { Project, User, Task, Assignment, Log } = require('../../../src/models');
const { Op } = require('sequelize');

jest.mock('../../../src/models');
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/notification.service');

describe('Project Controller - Unit Tests', () => {
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

  describe('getAllProjects', () => {
    it('should return all projects with pagination', async () => {
      const mockProjects = [
        { project_id: 1, project_name: 'Project 1', status: 'active' },
        { project_id: 2, project_name: 'Project 2', status: 'completed' }
      ];

      Project.findAndCountAll = jest.fn().mockResolvedValue({
        count: 2,
        rows: mockProjects
      });

      req.query = { page: 1, limit: 10 };

      await projectController.getAllProjects(req, res);

      expect(Project.findAndCountAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          projects: mockProjects,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1
          }
        }
      });
    });

    it('should filter projects by status', async () => {
      req.query = { status: 'active', page: 1, limit: 10 };

      Project.findAndCountAll = jest.fn().mockResolvedValue({
        count: 1,
        rows: []
      });

      await projectController.getAllProjects(req, res);

      const callArgs = Project.findAndCountAll.mock.calls[0][0];
      expect(callArgs.where[Op.and]).toContainEqual({ status: 'active' });
    });

    it('should search projects by name or details', async () => {
      req.query = { search: 'test', page: 1, limit: 10 };

      Project.findAndCountAll = jest.fn().mockResolvedValue({
        count: 0,
        rows: []
      });

      await projectController.getAllProjects(req, res);

      expect(Project.findAndCountAll).toHaveBeenCalled();
    });
  });

  describe('getProjectById', () => {
    it('should return project by ID with relationships', async () => {
      const mockProject = {
        project_id: 1,
        project_name: 'Test Project',
        assignments: [],
        tasks: [],
        toJSON: jest.fn().mockReturnValue({
          project_id: 1,
          project_name: 'Test Project',
          assignments: []
        })
      };

      Project.findOne = jest.fn().mockResolvedValue(mockProject);

      req.params.id = 1;

      await projectController.getProjectById(req, res);

      expect(Project.findOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          project: expect.any(Object)
        })
      });
    });

    it('should return 404 if project not found', async () => {
      Project.findOne = jest.fn().mockResolvedValue(null);

      req.params.id = 999;

      await projectController.getProjectById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Project not found'
      });
    });
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      const mockProject = {
        project_id: 1,
        project_name: 'New Project',
        project_details: 'Details',
        status: 'active',
        manager_id: 1,
        created_by: 1
      };

      User.findByPk = jest.fn().mockResolvedValue({
        user_id: 1,
        role: 'manager'
      });

      Project.create = jest.fn().mockResolvedValue(mockProject);

      Project.findByPk = jest.fn().mockResolvedValue({
        ...mockProject,
        toJSON: jest.fn().mockReturnValue(mockProject)
      });

      req.body = {
        project_name: 'New Project',
        project_details: 'Details',
        status: 'active',
        managerId: 1
      };

      await projectController.createProject(req, res);

      expect(Project.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Project created successfully',
        data: expect.objectContaining({
          project: expect.any(Object)
        })
      });
    });

    it('should return 400 if manager is invalid', async () => {
      User.findByPk = jest.fn().mockResolvedValue({
        user_id: 1,
        role: 'developer'
      });

      req.body = {
        project_name: 'New Project',
        project_details: 'Details',
        status: 'active',
        managerId: 1
      };

      await projectController.createProject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid manager ID'
      });
    });
  });

  describe('updateProject', () => {
    it('should update an existing project', async () => {
      const mockProject = {
        project_id: 1,
        project_name: 'Old Name',
        update: jest.fn().mockResolvedValue(true)
      };

      Project.findOne = jest.fn().mockResolvedValue(mockProject);
      User.findByPk = jest.fn().mockResolvedValue({
        user_id: 1,
        role: 'manager'
      });

      req.params.id = 1;
      req.body = {
        project_name: 'New Name',
        project_details: 'New Details',
        status: 'completed',
        managerId: 1
      };

      await projectController.updateProject(req, res);

      expect(mockProject.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Project updated successfully',
        data: { project: mockProject }
      });
    });

    it('should return 404 if project not found', async () => {
      Project.findOne = jest.fn().mockResolvedValue(null);

      req.params.id = 999;
      req.body = { project_name: 'New Name' };

      await projectController.updateProject(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Project not found'
      });
    });
  });

  describe('deleteProject', () => {
    it('should soft delete a project', async () => {
      const mockProject = {
        project_id: 1,
        project_name: 'Test Project',
        softDelete: jest.fn().mockResolvedValue(true)
      };

      Project.findOne = jest.fn().mockResolvedValue(mockProject);

      req.params.id = 1;

      await projectController.deleteProject(req, res);

      expect(mockProject.softDelete).toHaveBeenCalledWith(req.user.user_id);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Project deleted successfully'
      });
    });

    it('should return 404 if project not found', async () => {
      Project.findOne = jest.fn().mockResolvedValue(null);

      req.params.id = 999;

      await projectController.deleteProject(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getProjectAnalytics', () => {
    it('should return project analytics', async () => {
      const mockProject = {
        project_id: 1,
        project_name: 'Test Project',
        tasks: [
          { task_id: 1, status: 'completed', logs: [], estimate_time: 5 },
          { task_id: 2, status: 'in_progress', logs: [], estimate_time: 3 },
          { task_id: 3, status: 'todo', logs: [], estimate_time: 2 }
        ]
      };

      Project.findOne = jest.fn().mockResolvedValue(mockProject);

      req.params.id = 1;

      await projectController.getProjectAnalytics(req, res);

      expect(Project.findOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          analytics: expect.objectContaining({
            projectId: 1,
            projectName: 'Test Project',
            totalTasks: 3,
            completedTasks: 1,
            inProgressTasks: 1,
            pendingTasks: 1
          })
        }
      });
    });

    it('should return 404 if project not found', async () => {
      Project.findOne = jest.fn().mockResolvedValue(null);

      req.params.id = 999;

      await projectController.getProjectAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});

