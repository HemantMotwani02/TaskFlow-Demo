const { sequelize } = require('../config/database');

// Import models
const User = require('./user.model');
const Project = require('./project.model');
const Task = require('./task.model');
const Log = require('./log.model');
const Assignment = require('./assignment.model');
const Notification = require('./notification.model');
const OTP = require('./otp.model');
const PermissionDefinition = require('./permissionDefinition.model');
const PermissionGroup = require('./permissionGroup.model');
const PermissionGroupItem = require('./permissionGroupItem.model');

// Define associations
const defineAssociations = () => {
  // User associations
  User.hasMany(Project, { 
    foreignKey: 'manager_id', 
    as: 'managedProjects' 
  });
  User.hasMany(Project, { 
    foreignKey: 'created_by', 
    as: 'createdProjects' 
  });
  User.hasMany(Task, { 
    foreignKey: 'created_by', 
    as: 'createdTasks' 
  });
  User.hasMany(Log, { 
    foreignKey: 'user_id', 
    as: 'logs' 
  });
  User.hasMany(Assignment, { 
    foreignKey: 'user_id', 
    as: 'assignments' 
  });
  User.hasMany(Assignment, { 
    foreignKey: 'manager_id', 
    as: 'managedAssignments' 
  });
  User.hasMany(Task, { 
    foreignKey: 'assigned_to', 
    as: 'assignedTasks' 
  });
  User.belongsTo(PermissionGroup, {
    foreignKey: 'permission_group_id',
    as: 'permissionGroup'
  });

  // Project associations
  Project.belongsTo(User, { 
    foreignKey: 'manager_id', 
    as: 'manager' 
  });
  Project.belongsTo(User, { 
    foreignKey: 'created_by', 
    as: 'creator' 
  });
  Project.hasMany(Task, { 
    foreignKey: 'project_id', 
    as: 'tasks' 
  });
  Project.hasMany(Assignment, { 
    foreignKey: 'project_id', 
    as: 'assignments' 
  });

  // Task associations
  Task.belongsTo(Project, { 
    foreignKey: 'project_id', 
    as: 'project' 
  });
  Task.belongsTo(User, { 
    foreignKey: 'created_by', 
    as: 'creator' 
  });
  Task.belongsTo(User, { 
    foreignKey: 'assigned_to', 
    as: 'assignedUser' 
  });
  Task.hasMany(Log, { 
    foreignKey: 'task_id', 
    as: 'logs' 
  });

  // Log associations
  Log.belongsTo(User, { 
    foreignKey: 'user_id', 
    as: 'user' 
  });
  Log.belongsTo(Project, {
    foreignKey: 'project_id',
    as: 'project'
  });
  Log.belongsTo(Task, { 
    foreignKey: 'task_id', 
    as: 'task' 
  });
  Log.belongsTo(User, { 
    foreignKey: 'approved_by', 
    as: 'approver' 
  });

  // Assignment associations
  Assignment.belongsTo(User, { 
    foreignKey: 'user_id', 
    as: 'user' 
  });
  Assignment.belongsTo(Project, { 
    foreignKey: 'project_id', 
    as: 'project' 
  });
  Assignment.belongsTo(User, { 
    foreignKey: 'manager_id', 
    as: 'manager' 
  });

  // Notification associations
  Notification.belongsTo(User, { foreignKey: 'recipient_id', as: 'recipient' });
  Notification.belongsTo(User, { foreignKey: 'actor_id', as: 'actor' });
  Notification.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
  Notification.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });

  // Permission associations
  PermissionGroup.belongsTo(User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
  PermissionGroup.hasMany(PermissionGroupItem, {
    foreignKey: 'permission_group_id',
    as: 'groupItems'
  });

  PermissionGroupItem.belongsTo(PermissionGroup, {
    foreignKey: 'permission_group_id',
    as: 'permissionGroup'
  });
  PermissionGroupItem.belongsTo(PermissionDefinition, {
    foreignKey: 'permission_definition_id',
    as: 'permissionDefinition'
  });
  PermissionDefinition.hasMany(PermissionGroupItem, {
    foreignKey: 'permission_definition_id',
    as: 'groupItems'
  });
};

// Initialize associations
defineAssociations();

module.exports = {
  sequelize,
  User,
  Project,
  Task,
  Log,
  Assignment,
  Notification,
  OTP,
  PermissionDefinition,
  PermissionGroup,
  PermissionGroupItem
};
