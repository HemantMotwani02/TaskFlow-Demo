const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Project extends Model {
  // Instance methods
  getProgress() {
    if (!this.tasks || this.tasks.length === 0) return 0;
    const completedTasks = this.tasks.filter(task => task.status === 'completed');
    return Math.round((completedTasks.length / this.tasks.length) * 100);
  }

  getTotalBudget() {
    if (!this.tasks || this.tasks.length === 0) return 0;
    return this.tasks.reduce((total, task) => total + (task.estimate_time || 0), 0);
  }

  getActualTime() {
    if (!this.tasks || this.tasks.length === 0) return 0;
    return this.tasks.reduce((total, task) => total + (task.actual_time || 0), 0);
  }

  toJSON() {
    const values = { ...this.get() };
    if (this.tasks) {
      values.progress = this.getProgress();
      values.totalBudget = this.getTotalBudget();
      values.actualTime = this.getActualTime();
    }
    return values;
  }

  // Instance methods
  async softDelete(deletedBy) {
    this.deleted_at = new Date();
    this.deleted_by = deletedBy;
    return this.save();
  }

  // Static methods
  static async findActiveProjects() {
    return this.findAll({
      where: { 
        status: ['planning', 'in_progress'],
        deleted_at: null
      },
      include: [
        {
          model: sequelize.models.User,
          as: 'manager',
          attributes: ['user_id', 'name', 'email']
        }
      ]
    });
  }

  static async findProjectsByManager(managerId) {
    return this.findAll({
      where: { 
        manager_id: managerId,
        deleted_at: null
      },
      include: [
        {
          model: sequelize.models.Task,
          as: 'tasks',
          attributes: ['task_id', 'task_name', 'status', 'priority']
        }
      ]
    });
  }
}

Project.init({
  project_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  project_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 255],
      notEmpty: true
    }
  },
  project_details: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [0, 2000]
    }
  },
  manager_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'userinfos',
      key: 'user_id'
    }
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'userinfos',
      key: 'user_id'
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'planning'
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'userinfos',
      key: 'user_id'
    }
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deleted_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'userinfos',
      key: 'user_id'
    }
  }
}, {
  sequelize,
  modelName: 'Project',
  tableName: 'projects',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['manager_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_by']
    }
  ]
});

module.exports = Project;
