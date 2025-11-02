const request = require('supertest');
const app = require('../../src/app');
const { User, Project } = require('../../src/models');
const { sequelize } = require('../../src/config/database');

describe('Project API Integration Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Create test user and get auth token
    testUser = await User.create({
      name: 'Test Manager',
      email: 'manager@test.com',
      password: 'password123',
      role: 'manager'
    });

    authToken = testUser.generateAuthToken();
  });

  afterEach(async () => {
    // Clean up database
    await Project.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const projectData = {
        project_name: 'Test Project',
        project_details: 'Test project details',
        status: 'planning'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.project_name).toBe(projectData.project_name);
      expect(response.body.data.project.project_details).toBe(projectData.project_details);
    });

    it('should return 401 if not authenticated', async () => {
      const projectData = {
        project_name: 'Test Project',
        project_details: 'Test project details',
        status: 'planning'
      };

      await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(401);
    });

    it('should return 400 for invalid project data', async () => {
      const invalidData = {
        project_details: 'Missing project name'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/projects', () => {
    beforeEach(async () => {
      // Create test projects
      await Project.create({
        project_name: 'Project 1',
        project_details: 'Details 1',
        status: 'in_progress',
        manager_id: testUser.user_id,
        created_by: testUser.user_id
      });

      await Project.create({
        project_name: 'Project 2',
        project_details: 'Details 2',
        status: 'completed',
        manager_id: testUser.user_id,
        created_by: testUser.user_id
      });
    });

    it('should return all projects', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projects).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter projects by status', async () => {
      const response = await request(app)
        .get('/api/projects?status=completed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projects).toHaveLength(1);
      expect(response.body.data.projects[0].status).toBe('completed');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/projects?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projects).toHaveLength(1);
      expect(response.body.data.pagination.total).toBe(2);
      expect(response.body.data.pagination.pages).toBe(2);
    });

    it('should search projects by name', async () => {
      const response = await request(app)
        .get('/api/projects?search=Project 1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projects).toHaveLength(1);
      expect(response.body.data.projects[0].project_name).toContain('Project 1');
    });
  });

  describe('GET /api/projects/:id', () => {
    let testProject;

    beforeEach(async () => {
      testProject = await Project.create({
        project_name: 'Test Project',
        project_details: 'Test details',
        status: 'in_progress',
        manager_id: testUser.user_id,
        created_by: testUser.user_id
      });
    });

    it('should return project by ID', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.project_id).toBe(testProject.project_id);
      expect(response.body.data.project.project_name).toBe(testProject.project_name);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/projects/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Project not found');
    });
  });

  describe('PUT /api/projects/:id', () => {
    let testProject;

    beforeEach(async () => {
      testProject = await Project.create({
        project_name: 'Original Name',
        project_details: 'Original details',
        status: 'planning',
        manager_id: testUser.user_id,
        created_by: testUser.user_id
      });
    });

    it('should update project', async () => {
      const updates = {
        project_name: 'Updated Name',
        project_details: 'Updated details',
        status: 'in_progress'
      };

      const response = await request(app)
        .put(`/api/projects/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.project_name).toBe(updates.project_name);
      expect(response.body.data.project.status).toBe(updates.status);
    });

    it('should return 404 for non-existent project', async () => {
      const updates = {
        project_name: 'Updated Name'
      };

      await request(app)
        .put('/api/projects/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(404);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    let testProject;
    let adminUser;
    let adminToken;

    beforeEach(async () => {
      adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin'
      });

      adminToken = adminUser.generateAuthToken();

      testProject = await Project.create({
        project_name: 'Test Project',
        project_details: 'Test details',
        status: 'in_progress',
        manager_id: testUser.user_id,
        created_by: testUser.user_id
      });
    });

    it('should soft delete project (admin only)', async () => {
      const response = await request(app)
        .delete(`/api/projects/${testProject.project_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project deleted successfully');
    });

    it('should return 403 if not admin', async () => {
      await request(app)
        .delete(`/api/projects/${testProject.project_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('GET /api/projects/:id/analytics', () => {
    let testProject;

    beforeEach(async () => {
      testProject = await Project.create({
        project_name: 'Test Project',
        project_details: 'Test details',
        status: 'in_progress',
        manager_id: testUser.user_id,
        created_by: testUser.user_id
      });
    });

    it('should return project analytics', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject.project_id}/analytics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analytics).toBeDefined();
      expect(response.body.data.analytics).toHaveProperty('projectId');
      expect(response.body.data.analytics).toHaveProperty('totalTasks');
      expect(response.body.data.analytics).toHaveProperty('completedTasks');
      expect(response.body.data.analytics).toHaveProperty('completionRate');
    });
  });
});

