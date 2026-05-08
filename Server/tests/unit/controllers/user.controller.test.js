const userController = require('../../../src/controllers/user.controller');
const { User, Project, Task, Assignment } = require('../../../src/models');

jest.mock('../../../src/models');
jest.mock('../../../src/utils/logger');

describe('User Controller - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
      user: { user_id: 1, email: 'admin@test.com', role: 'admin' }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users with pagination', async () => {
      const mockUsers = [
        { user_id: 1, name: 'User 1', email: 'user1@test.com', role: 'developer' },
        { user_id: 2, name: 'User 2', email: 'user2@test.com', role: 'manager' }
      ];

      User.findAndCountAll = jest.fn().mockResolvedValue({
        count: 2,
        rows: mockUsers
      });

      req.query = { page: 1, limit: 10 };

      await userController.getAllUsers(req, res);

      expect(User.findAndCountAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          users: mockUsers,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1
          }
        }
      });
    });

    it('should filter users by role', async () => {
      req.query = { role: 'developer', page: 1, limit: 10 };

      User.findAndCountAll = jest.fn().mockResolvedValue({
        count: 1,
        rows: []
      });

      await userController.getAllUsers(req, res);

      const callArgs = User.findAndCountAll.mock.calls[0][0];
      expect(callArgs.where).toHaveProperty('role', 'developer');
    });

    it('should search users by name or email', async () => {
      req.query = { q: 'john', page: 1, limit: 10 };

      User.findAndCountAll = jest.fn().mockResolvedValue({
        count: 1,
        rows: []
      });

      await userController.getAllUsers(req, res);

      expect(User.findAndCountAll).toHaveBeenCalled();
    });
  });

  describe('getUserCounts', () => {
    it('should return user counts by role', async () => {
      User.count = jest.fn()
        .mockResolvedValueOnce(10)  // total
        .mockResolvedValueOnce(2)   // admin
        .mockResolvedValueOnce(3)   // manager
        .mockResolvedValueOnce(5);  // developer

      await userController.getUserCounts(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          total: 10,
          admins: 2,
          managers: 3,
          developers: 5
        }
      });
    });

    it('should handle errors gracefully', async () => {
      User.count = jest.fn().mockRejectedValue(new Error('Database error'));

      await userController.getUserCounts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const mockUser = {
        user_id: 1,
        name: 'Test User',
        email: 'test@test.com'
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      req.params.id = 1;

      await userController.getUserById(req, res);

      expect(User.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { user: mockUser }
      });
    });

    it('should return 404 if user not found', async () => {
      User.findByPk = jest.fn().mockResolvedValue(null);

      req.params.id = 999;

      await userController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const mockUser = {
        user_id: 1,
        name: 'New User',
        email: 'new@test.com',
        role: 'developer',
        toJSON: jest.fn().mockReturnValue({
          user_id: 1,
          name: 'New User',
          email: 'new@test.com'
        })
      };

      User.findOne = jest.fn().mockResolvedValue(null);
      User.create = jest.fn().mockResolvedValue(mockUser);

      req.body = {
        name: 'New User',
        email: 'new@test.com',
        password: 'password123',
        role: 'developer'
      };

      await userController.createUser(req, res);

      expect(User.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 409 if email already exists', async () => {
      User.findOne = jest.fn().mockResolvedValue({ email: 'existing@test.com' });

      req.body = {
        name: 'New User',
        email: 'existing@test.com',
        password: 'password123'
      };

      await userController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('updateUser', () => {
    it('should update an existing user', async () => {
      const mockUser = {
        user_id: 1,
        name: 'Old Name',
        email: 'test@test.com',
        update: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({ user_id: 1, name: 'New Name' })
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);
      User.findOne = jest.fn().mockResolvedValue(null);

      req.params.id = 1;
      req.body = {
        name: 'New Name',
        email: 'test@test.com'
      };

      await userController.updateUser(req, res);

      expect(mockUser.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User updated successfully',
        data: expect.any(Object)
      });
    });

    it('should return 409 if email is taken by another user', async () => {
      const mockUser = {
        user_id: 1,
        email: 'old@test.com'
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);
      User.findOne = jest.fn().mockResolvedValue({ user_id: 2, email: 'new@test.com' });

      req.params.id = 1;
      req.body = { email: 'new@test.com' };

      await userController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const mockUser = {
        user_id: 1,
        role: 'developer',
        destroy: jest.fn().mockResolvedValue(true)
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      req.params.id = 1;

      await userController.deleteUser(req, res);

      expect(mockUser.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User deleted successfully'
      });
    });

    it('should prevent deleting the last admin', async () => {
      const mockUser = {
        user_id: 1,
        role: 'admin'
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);
      User.count = jest.fn().mockResolvedValue(1);

      req.params.id = 1;

      await userController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getManagers', () => {
    it('should return all managers', async () => {
      const mockManagers = [
        { user_id: 1, name: 'Manager 1', role: 'manager' },
        { user_id: 2, name: 'Manager 2', role: 'manager' }
      ];

      User.findAll = jest.fn().mockResolvedValue(mockManagers);

      await userController.getManagers(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { managers: mockManagers }
      });
    });

    it('should include developers if no managers found', async () => {
      User.findAll = jest.fn()
        .mockResolvedValueOnce([])  // No managers
        .mockResolvedValueOnce([{ user_id: 1, role: 'developer' }]);  // Developers

      await userController.getManagers(req, res);

      expect(User.findAll).toHaveBeenCalledTimes(2);
    });
  });
});

