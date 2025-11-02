const assignmentController = require('../../../src/controllers/assignment.controller');
const { Assignment, Project, User } = require('../../../src/models');

jest.mock('../../../src/models');
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/notification.service');

describe('Assignment Controller - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
      user: { user_id: 1, email: 'manager@test.com', role: 'manager' }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('createAssignment', () => {
    it('should create a new assignment', async () => {
      const mockProject = {
        project_id: 1,
        name: 'Test Project',
        manager_id: 1
      };

      const mockUser = {
        user_id: 2,
        name: 'Developer',
        email: 'dev@test.com',
        role: 'developer'
      };

      const mockAssignment = {
        assignment_id: 1,
        project_id: 1,
        user_id: 2,
        is_active: true
      };

      Project.findByPk = jest.fn().mockResolvedValue(mockProject);
      User.findByPk = jest.fn().mockResolvedValue(mockUser);
      Assignment.findOne = jest.fn().mockResolvedValue(null);
      Assignment.create = jest.fn().mockResolvedValue(mockAssignment);

      req.body = {
        projectId: 1,
        userId: 2
      };

      await assignmentController.createAssignment(req, res);

      expect(Assignment.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if project not found', async () => {
      Project.findByPk = jest.fn().mockResolvedValue(null);

      req.body = {
        projectId: 999,
        userId: 2
      };

      await assignmentController.createAssignment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if user is not a developer', async () => {
      const mockProject = { project_id: 1 };
      const mockUser = { user_id: 2, role: 'manager' };

      Project.findByPk = jest.fn().mockResolvedValue(mockProject);
      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      req.body = {
        projectId: 1,
        userId: 2
      };

      await assignmentController.createAssignment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 409 if assignment already exists', async () => {
      const mockProject = { project_id: 1 };
      const mockUser = { user_id: 2, role: 'developer' };
      const existingAssignment = { assignment_id: 1 };

      Project.findByPk = jest.fn().mockResolvedValue(mockProject);
      User.findByPk = jest.fn().mockResolvedValue(mockUser);
      Assignment.findOne = jest.fn().mockResolvedValue(existingAssignment);

      req.body = {
        projectId: 1,
        userId: 2
      };

      await assignmentController.createAssignment(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('deleteAssignment', () => {
    it('should delete assignment by admin', async () => {
      const mockAssignment = {
        assignment_id: 1,
        user_id: 2,
        project: { project_id: 1, manager_id: 1 },
        update: jest.fn().mockResolvedValue(true)
      };

      Assignment.findByPk = jest.fn().mockResolvedValue(mockAssignment);

      req.user.role = 'admin';
      req.params.id = 1;

      await assignmentController.deleteAssignment(req, res);

      expect(mockAssignment.update).toHaveBeenCalledWith({ is_active: false });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Assignment removed successfully'
      });
    });

    it('should allow project manager to delete assignment', async () => {
      const mockAssignment = {
        assignment_id: 1,
        user_id: 2,
        project: { project_id: 1, manager_id: 1 },
        update: jest.fn().mockResolvedValue(true)
      };

      Assignment.findByPk = jest.fn().mockResolvedValue(mockAssignment);

      req.user.user_id = 1;
      req.user.role = 'manager';
      req.params.id = 1;

      await assignmentController.deleteAssignment(req, res);

      expect(mockAssignment.update).toHaveBeenCalled();
    });

    it('should return 403 if insufficient permissions', async () => {
      const mockAssignment = {
        assignment_id: 1,
        user_id: 3,
        project: { project_id: 1, manager_id: 2 }
      };

      Assignment.findByPk = jest.fn().mockResolvedValue(mockAssignment);

      req.user.user_id = 1;
      req.user.role = 'developer';
      req.params.id = 1;

      await assignmentController.deleteAssignment(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('bulkAssign', () => {
    it('should create multiple assignments', async () => {
      const mockProject = {
        project_id: 1,
        manager_id: 1
      };

      const mockUser1 = { user_id: 2, email: 'dev1@test.com', role: 'developer' };
      const mockUser2 = { user_id: 3, email: 'dev2@test.com', role: 'developer' };

      Project.findByPk = jest.fn().mockResolvedValue(mockProject);
      User.findByPk = jest.fn()
        .mockResolvedValueOnce(mockUser1)
        .mockResolvedValueOnce(mockUser2);
      Assignment.findOne = jest.fn().mockResolvedValue(null);
      Assignment.create = jest.fn()
        .mockResolvedValueOnce({ assignment_id: 1 })
        .mockResolvedValueOnce({ assignment_id: 2 });

      req.body = {
        projectId: 1,
        assignments: [
          { userId: 2 },
          { userId: 3 }
        ]
      };

      await assignmentController.bulkAssign(req, res);

      expect(Assignment.create).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});

