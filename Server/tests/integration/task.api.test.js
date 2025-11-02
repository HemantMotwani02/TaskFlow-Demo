const request = require('supertest');
const app = require('../../src/app');
const { User, Project, Task } = require('../../src/models');
const { sequelize } = require('../../src/config/database');

describe('Task API Integration Tests', () => {
  let authToken;
  let testUser;
  let testProject;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      name: 'Test Manager',
      email: 'manager@test.com',
      password: 'password123',
      role: 'manager'
    });

    authToken = testUser.generateAuthToken();

    // Create test project
    testProject = await Project.create({
      project_name: 'Test Project',
      project_details: 'Test project details',
      status: 'in_progress',
      manager_id: testUser.user_id,
      created_by: testUser.user_id
    });
  });

  afterEach(async () => {
    await Task.destroy({ where: {}, force: true });
    await Project.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const taskData = {
        task_name: 'Implement Feature',
        task_details: 'Implement new feature',
        status: 'todo',
        priority: 'high',
        estimate_time: '8',
        projectId: testProject.project_id
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.task.task_name).toBe(taskData.task_name);
    });

    it('should return 401 if not authenticated', async () => {
      const taskData = {
        task_name: 'Test Task',
        projectId: testProject.project_id
      };

      await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(401);
    });

    it('should return 400 for invalid project', async () => {
      const taskData = {
        task_name: 'Test Task',
        task_details: 'Details',
        status: 'todo',
        projectId: 99999
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      await Task.create({
        task_name: 'Task 1',
        task_details: 'Details 1',
        status: 'todo',
        project_id: testProject.project_id,
        created_by: testUser.user_id
      });

      await Task.create({
        task_name: 'Task 2',
        task_details: 'Details 2',
        status: 'in_progress',
        project_id: testProject.project_id,
        created_by: testUser.user_id
      });
    });

    it('should return all tasks', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/tasks?status=todo')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toHaveLength(1);
      expect(response.body.data.tasks[0].status).toBe('todo');
    });

    it('should search tasks', async () => {
      const response = await request(app)
        .get('/api/tasks?search=Task 1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toHaveLength(1);
    });
  });

  describe('GET /api/tasks/:id', () => {
    let testTask;

    beforeEach(async () => {
      testTask = await Task.create({
        task_name: 'Test Task',
        task_details: 'Test details',
        status: 'todo',
        project_id: testProject.project_id,
        created_by: testUser.user_id
      });
    });

    it('should return task by ID', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTask.task_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.task_id).toBe(testTask.task_id);
    });

    it('should return 404 for non-existent task', async () => {
      await request(app)
        .get('/api/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let testTask;

    beforeEach(async () => {
      testTask = await Task.create({
        task_name: 'Original Task',
        task_details: 'Original details',
        status: 'todo',
        project_id: testProject.project_id,
        created_by: testUser.user_id
      });
    });

    it('should update task', async () => {
      const updates = {
        task_name: 'Updated Task',
        task_details: 'Updated details',
        status: 'in_progress'
      };

      const response = await request(app)
        .put(`/api/tasks/${testTask.task_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.task.task_name).toBe(updates.task_name);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let testTask;

    beforeEach(async () => {
      testTask = await Task.create({
        task_name: 'Task to Delete',
        task_details: 'Details',
        status: 'todo',
        project_id: testProject.project_id,
        created_by: testUser.user_id
      });
    });

    it('should delete task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${testTask.task_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify task is deleted
      const deletedTask = await Task.findByPk(testTask.task_id);
      expect(deletedTask).toBeNull();
    });
  });

  describe('PATCH /api/tasks/:id/status', () => {
    let testTask;

    beforeEach(async () => {
      testTask = await Task.create({
        task_name: 'Test Task',
        task_details: 'Details',
        status: 'todo',
        project_id: testProject.project_id,
        created_by: testUser.user_id
      });
    });

    it('should update task status', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${testTask.task_id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'completed' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.task.status).toBe('completed');
    });
  });

  describe('POST /api/tasks/bulk', () => {
    it('should create multiple tasks', async () => {
      const bulkData = {
        projectId: testProject.project_id,
        tasks: [
          {
            task_name: 'Bulk Task 1',
            task_details: 'Details 1',
            status: 'todo',
            estimate_time: '5'
          },
          {
            task_name: 'Bulk Task 2',
            task_details: 'Details 2',
            status: 'todo',
            estimate_time: '3'
          }
        ]
      };

      const response = await request(app)
        .post('/api/tasks/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toHaveLength(2);
    });
  });

  describe('GET /api/tasks/analytics/overview', () => {
    beforeEach(async () => {
      await Task.create({
        task_name: 'Task 1',
        task_details: 'Details',
        status: 'completed',
        project_id: testProject.project_id,
        created_by: testUser.user_id
      });

      await Task.create({
        task_name: 'Task 2',
        task_details: 'Details',
        status: 'in_progress',
        project_id: testProject.project_id,
        created_by: testUser.user_id
      });
    });

    it('should return task analytics', async () => {
      const response = await request(app)
        .get('/api/tasks/analytics/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analytics).toBeDefined();
      expect(response.body.data.analytics.total).toBe(2);
    });
  });
});

