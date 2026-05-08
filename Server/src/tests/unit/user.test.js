const { User } = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('User Model', () => {
  describe('Validations', () => {
    it('should create a valid user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: '3'
      };

      const user = await User.create(userData);
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(userData.role);
      expect(user.isActive).toBe(true);
    });

    it('should require name', async () => {
      const userData = {
        email: 'john@example.com',
        password: 'password123'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require email', async () => {
      const userData = {
        name: 'John Doe',
        password: 'password123'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should validate password length', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should validate role enum', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: '6'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should validate phone format', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: 'invalid-phone'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should enforce unique email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      await User.create(userData);
      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('Hooks', () => {
    it('should hash password before save', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = await User.create(userData);
      expect(user.password).not.toBe(userData.password);
      expect(await bcrypt.compare(userData.password, user.password)).toBe(true);
    });

    it('should not rehash password if unchanged', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = await User.create(userData);
      const originalHash = user.password;

      user.name = 'Jane Doe';
      await user.save();

      expect(user.password).toBe(originalHash);
    });
  });

  describe('Instance Methods', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });
    });

    it('should compare password correctly', async () => {
      expect(await user.comparePassword('password123')).toBe(true);
      expect(await user.comparePassword('wrongpassword')).toBe(false);
    });

    it('should generate auth token', () => {
      const token = user.generateAuthToken();
      expect(typeof token).toBe('string');
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(user.role);
    });

    it('should exclude password and token from JSON', () => {
      const userJson = user.toJSON();
      expect(userJson.password).toBeUndefined();
      expect(userJson.token).toBeUndefined();
      expect(userJson.name).toBe(user.name);
      expect(userJson.email).toBe(user.email);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: '2'
      });

      await User.create({
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        role: '3'
      });
    });

    it('should find user by email', async () => {
      const user = await User.findByEmail('john@example.com');
      expect(user).toBeTruthy();
      expect(user.name).toBe('John Doe');
    });

    it('should return null for non-existent email', async () => {
      const user = await User.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });

    it('should find managers', async () => {
      const managers = await User.findManagers();
      expect(managers).toHaveLength(1);
      expect(managers[0].role).toBe('2');
    });

    it('should find active users', async () => {
      const activeUsers = await User.findActiveUsers();
      expect(activeUsers).toHaveLength(2);
      expect(activeUsers.every(user => user.isActive)).toBe(true);
    });
  });

  describe('Database Operations', () => {
    it('should update user', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      await user.update({ name: 'Jane Doe' });
      expect(user.name).toBe('Jane Doe');
    });

    it('should delete user', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      await user.destroy();
      const foundUser = await User.findByPk(user.id);
      expect(foundUser).toBeNull();
    });

    it('should find user by primary key', async () => {
      const createdUser = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const foundUser = await User.findByPk(createdUser.id);
      expect(foundUser).toBeTruthy();
      expect(foundUser.id).toBe(createdUser.id);
    });
  });
});
