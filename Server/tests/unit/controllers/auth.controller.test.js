const authController = require('../../../src/controllers/auth.controller');
const { User } = require('../../../src/models');

jest.mock('../../../src/models');
jest.mock('../../../src/utils/logger');

describe('Auth Controller - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
      user: { user_id: 1, email: 'test@test.com' },
      file: null,
      get: jest.fn()
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const mockUser = {
        user_id: 1,
        name: 'Test User',
        email: 'test@test.com',
        generateAuthToken: jest.fn().mockReturnValue('mock-token'),
        toJSON: jest.fn().mockReturnValue({
          user_id: 1,
          name: 'Test User',
          email: 'test@test.com'
        })
      };

      User.findOne = jest.fn().mockResolvedValue(null);
      User.create = jest.fn().mockResolvedValue(mockUser);

      req.body = {
        name: 'Test User',
        email: 'test@test.com',
        password: 'password123',
        role: 3
      };

      await authController.register(req, res);

      expect(User.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: {
          user: expect.any(Object),
          token: 'mock-token'
        }
      });
    });

    it('should return 409 if user already exists', async () => {
      User.findOne = jest.fn().mockResolvedValue({ email: 'existing@test.com' });

      req.body = {
        name: 'Test User',
        email: 'existing@test.com',
        password: 'password123'
      };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 400 if body is missing', async () => {
      req.body = null;

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = {
        user_id: 1,
        email: 'test@test.com',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(true),
        generateAuthToken: jest.fn().mockReturnValue('mock-token'),
        update: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          user_id: 1,
          email: 'test@test.com'
        })
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      req.body = {
        email: 'test@test.com',
        password: 'password123'
      };

      await authController.login(req, res);

      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: {
          user: expect.any(Object),
          token: 'mock-token'
        }
      });
    });

    it('should return 401 for invalid email', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      req.body = {
        email: 'nonexistent@test.com',
        password: 'password123'
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 for inactive user', async () => {
      const mockUser = {
        user_id: 1,
        email: 'test@test.com',
        isActive: false
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      req.body = {
        email: 'test@test.com',
        password: 'password123'
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 for invalid password', async () => {
      const mockUser = {
        user_id: 1,
        email: 'test@test.com',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      req.body = {
        email: 'test@test.com',
        password: 'wrongpassword'
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('getMe', () => {
    it('should return current user profile', async () => {
      const mockUser = {
        user_id: 1,
        name: 'Test User',
        email: 'test@test.com'
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      await authController.getMe(req, res);

      expect(User.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { user: mockUser }
      });
    });

    it('should return 404 if user not found', async () => {
      User.findByPk = jest.fn().mockResolvedValue(null);

      await authController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const mockUser = {
        user_id: 1,
        name: 'Old Name',
        email: 'old@test.com',
        profile: '/old/profile.jpg',
        update: jest.fn().mockResolvedValue(true)
      };

      const updatedUser = {
        user_id: 1,
        name: 'New Name',
        email: 'new@test.com',
        toJSON: jest.fn().mockReturnValue({
          user_id: 1,
          name: 'New Name'
        })
      };

      User.findByPk = jest.fn()
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(updatedUser);
      User.findOne = jest.fn().mockResolvedValue(null);

      req.body = {
        name: 'New Name',
        email: 'new@test.com'
      };

      await authController.updateProfile(req, res);

      expect(mockUser.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
        data: expect.any(Object)
      });
    });

    it('should return 409 if email is already taken', async () => {
      const mockUser = {
        user_id: 1,
        email: 'old@test.com'
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);
      User.findOne = jest.fn().mockResolvedValue({ user_id: 2 });

      req.body = {
        email: 'taken@test.com'
      };

      await authController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 400 if passwords do not match', async () => {
      const mockUser = {
        user_id: 1,
        email: 'test@test.com'
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      req.body = {
        password: 'newpassword',
        confirmPassword: 'differentpassword'
      };

      await authController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      await authController.logout(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful'
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token for active user', async () => {
      const mockUser = {
        user_id: 1,
        email: 'test@test.com',
        isActive: true,
        generateAuthToken: jest.fn().mockReturnValue('new-token'),
        toJSON: jest.fn().mockReturnValue({
          user_id: 1,
          email: 'test@test.com'
        })
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      await authController.refreshToken(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: expect.any(Object),
          token: 'new-token'
        }
      });
    });

    it('should return 401 for inactive user', async () => {
      const mockUser = {
        user_id: 1,
        isActive: false
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});

