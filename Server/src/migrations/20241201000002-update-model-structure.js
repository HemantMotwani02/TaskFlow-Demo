'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update userinfos table (not users)
    await queryInterface.changeColumn('userinfos', 'role', {
      type: Sequelize.ENUM('admin', 'manager', 'developer', 'designer', 'tester'),
      allowNull: false,
      defaultValue: 'developer'
    });

    // Update tasks table - add assigned_to field if it doesn't exist
    const tableDescription = await queryInterface.describeTable('tasks');
    if (!tableDescription.assigned_to) {
      await queryInterface.addColumn('tasks', 'assigned_to', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'userinfos',
          key: 'user_id'
        }
      });
    }

    // Update projects table - add missing fields if they don't exist
    const projectDescription = await queryInterface.describeTable('projects');
    if (!projectDescription.technologies) {
      await queryInterface.addColumn('projects', 'technologies', {
        type: Sequelize.JSON,
        allowNull: true
      });
    }

    if (!projectDescription.requirements) {
      await queryInterface.addColumn('projects', 'requirements', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    // Update assignments table - add missing fields if they don't exist
    const assignmentDescription = await queryInterface.describeTable('assignments');
    if (!assignmentDescription.role) {
      await queryInterface.addColumn('assignments', 'role', {
        type: Sequelize.ENUM('manager', 'developer', 'designer', 'tester', 'analyst'),
        allowNull: false,
        defaultValue: 'developer'
      });
    }

    if (!assignmentDescription.is_active) {
      await queryInterface.addColumn('assignments', 'is_active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
    }

    // Update logs table - add missing fields if they don't exist
    const logDescription = await queryInterface.describeTable('logs');
    if (!logDescription.approved_by) {
      await queryInterface.addColumn('logs', 'approved_by', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'userinfos',
          key: 'user_id'
        }
      });
    }

    if (!logDescription.approved_at) {
      await queryInterface.addColumn('logs', 'approved_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    // Add indexes for better performance - check if they exist first
    try {
      await queryInterface.addIndex('tasks', ['assigned_to'], { name: 'tasks_assigned_to_idx' });
    } catch (error) {
      // Index might already exist
    }

    try {
      await queryInterface.addIndex('tasks', ['project_id'], { name: 'tasks_project_id_idx' });
    } catch (error) {
      // Index might already exist
    }

    try {
      await queryInterface.addIndex('tasks', ['status'], { name: 'tasks_status_idx' });
    } catch (error) {
      // Index might already exist
    }

    try {
      await queryInterface.addIndex('projects', ['status'], { name: 'projects_status_idx' });
    } catch (error) {
      // Index might already exist
    }

    try {
      await queryInterface.addIndex('projects', ['manager_id'], { name: 'projects_manager_id_idx' });
    } catch (error) {
      // Index might already exist
    }

    try {
      await queryInterface.addIndex('logs', ['task_id'], { name: 'logs_task_id_idx' });
    } catch (error) {
      // Index might already exist
    }

    try {
      await queryInterface.addIndex('logs', ['user_id'], { name: 'logs_user_id_idx' });
    } catch (error) {
      // Index might already exist
    }

    try {
      await queryInterface.addIndex('logs', ['project_id'], { name: 'logs_project_id_idx' });
    } catch (error) {
      // Index might already exist
    }

    try {
      await queryInterface.addIndex('assignments', ['project_id'], { name: 'assignments_project_id_idx' });
    } catch (error) {
      // Index might already exist
    }

    try {
      await queryInterface.addIndex('assignments', ['user_id'], { name: 'assignments_user_id_idx' });
    } catch (error) {
      // Index might already exist
    }

    // Add unique constraint for active assignments
    try {
      await queryInterface.addConstraint('assignments', {
        fields: ['project_id', 'user_id'],
        type: 'unique',
        name: 'unique_active_assignment',
        where: {
          is_active: true
        }
      });
    } catch (error) {
      // Constraint might already exist
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    try {
      await queryInterface.removeIndex('tasks', 'tasks_assigned_to_idx');
    } catch (error) {
      // Index might not exist
    }

    try {
      await queryInterface.removeIndex('tasks', 'tasks_project_id_idx');
    } catch (error) {
      // Index might not exist
    }

    try {
      await queryInterface.removeIndex('tasks', 'tasks_status_idx');
    } catch (error) {
      // Index might not exist
    }

    try {
      await queryInterface.removeIndex('projects', 'projects_status_idx');
    } catch (error) {
      // Index might not exist
    }

    try {
      await queryInterface.removeIndex('projects', 'projects_manager_id_idx');
    } catch (error) {
      // Index might not exist
    }

    try {
      await queryInterface.removeIndex('logs', 'logs_task_id_idx');
    } catch (error) {
      // Index might not exist
    }

    try {
      await queryInterface.removeIndex('logs', 'logs_user_id_idx');
    } catch (error) {
      // Index might not exist
    }

    try {
      await queryInterface.removeIndex('logs', 'logs_project_id_idx');
    } catch (error) {
      // Index might not exist
    }

    try {
      await queryInterface.removeIndex('assignments', 'assignments_project_id_idx');
    } catch (error) {
      // Index might not exist
    }

    try {
      await queryInterface.removeIndex('assignments', 'assignments_user_id_idx');
    } catch (error) {
      // Index might not exist
    }

    // Remove unique constraint
    try {
      await queryInterface.removeConstraint('assignments', 'unique_active_assignment');
    } catch (error) {
      // Constraint might not exist
    }

    // Remove added columns
    try {
      await queryInterface.removeColumn('logs', 'approved_at');
    } catch (error) {
      // Column might not exist
    }

    try {
      await queryInterface.removeColumn('logs', 'approved_by');
    } catch (error) {
      // Column might not exist
    }

    try {
      await queryInterface.removeColumn('assignments', 'is_active');
    } catch (error) {
      // Column might not exist
    }

    try {
      await queryInterface.removeColumn('assignments', 'role');
    } catch (error) {
      // Column might not exist
    }

    try {
      await queryInterface.removeColumn('projects', 'requirements');
    } catch (error) {
      // Column might not exist
    }

    try {
      await queryInterface.removeColumn('projects', 'technologies');
    } catch (error) {
      // Column might not exist
    }

    try {
      await queryInterface.removeColumn('tasks', 'assigned_to');
    } catch (error) {
      // Column might not exist
    }

    // Revert role column
    try {
      await queryInterface.changeColumn('userinfos', 'role', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3
      });
    } catch (error) {
      // Column might not exist
    }
  }
};
