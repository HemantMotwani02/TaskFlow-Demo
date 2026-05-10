const request = require('supertest');
const app = require('../../src/app');
const { User } = require('../../src/models');
const { sequelize } = require('../../src/config/database');

describe('User API Integration Tests', () => {
  let authToken;
  let adminUser;

  beforeEach(async () => {
    // Create admin user
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });

    authToken = adminUser.generateAuthToken();
  });

  afterEach(async () => {
    await User.destroy({ where: {}, force: true });
  });

  describe('GET /api/users', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Developer 1',
        email: 'dev1@test.com',
        password: 'password123',
        role: 'developer'
      });

      await User.create({
        name: 'Manager 1',
        email: 'manager1@test.com',
        password: 'password123',
        role: 'manager'
      });
    });

    it('should return all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/users?role=developer')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.every(u => u.role === 'developer')).toBe(true);
    });

    it('should search users', async () => {
      const response = await request(app)
        .get('/api/users?q=Developer')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/users/counts', () => {
    it('should return user counts by role', async () => {
      await User.create({
        name: 'Developer 1',
        email: 'dev1@test.com',
        password: 'password123',
        role: 'developer'
      });

      const response = await request(app)
        .get('/api/users/counts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('admins');
      expect(response.body.data).toHaveProperty('managers');
      expect(response.body.data).toHaveProperty('developers');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@test.com',
        password: 'password123',
        role: 'developer'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        name: 'User',
        email: 'admin@test.com', // Same as admin
        password: 'password123',
        role: 'developer'
      };

      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(409);
    });
  });

  describe('GET /api/users/:id', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'testuser@test.com',
        password: 'password123',
        role: 'developer'
      });
    });

    it('should return user by ID', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.user_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/users/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/users/:id', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'testuser@test.com',
        password: 'password123',
        role: 'developer'
      });
    });

    it('should update user', async () => {
      const updates = {
        name: 'Updated Name',
        phone: '+1234567890'
      };

      const response = await request(app)
        .put(`/api/users/${testUser.user_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe(updates.name);
    });
  });

  describe('DELETE /api/users/:id', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'testuser@test.com',
        password: 'password123',
        role: 'developer'
      });
    });

    it('should delete user', async () => {
      const response = await request(app)
        .delete(`/api/users/${testUser.user_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify user is deleted
      const deletedUser = await User.findByPk(testUser.user_id);
      expect(deletedUser).toBeNull();
    });

    it('should prevent deleting last admin', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUser.user_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('last admin');
    });
  });

  describe('GET /api/users/managers', () => {
    it('should return all managers', async () => {
      await User.create({
        name: 'Manager 1',
        email: 'manager1@test.com',
        password: 'password123',
        role: 'manager'
      });

      const response = await request(app)
        .get('/api/users/managers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.managers).toBeDefined();
    });
  });
});

