const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Task extends Model {
  // Instance methods
  getProgress() {
    if (this.status === 'completed') return 100;
    if (this.status === 'in_progress') return 50;
    if (this.status === 'todo') return 0;
    return 0;
  }

  isOverdue() {
    if (!this.dueDate || this.status === 'completed') return false;
    return new Date() > new Date(this.dueDate);
  }

  getTimeVariance() {
    if (!this.estimate_time || !this.actual_time) return 0;
    return this.actual_time - this.estimate_time;
  }

  toJSON() {
    const values = { ...this.get() };
    values.progress = this.getProgress();
    values.isOverdue = this.isOverdue();
    values.timeVariance = this.getTimeVariance();
    return values;
  }

  // Static methods
  static async findTasksByProject(projectId) {
    return this.findAll({
      where: { project_id: projectId },
      include: [
        {
          model: sequelize.models.User,
          as: 'assignedUser',
          attributes: ['user_id', 'name', 'email']
        }
      ],
      order: [['priority', 'DESC'], ['dueDate', 'ASC']]
    });
  }

  static async findTasksByUser(userId) {
    return this.findAll({
      where: { assigned_to: userId },
      include: [
        {
          model: sequelize.models.Project,
          as: 'project',
          attributes: ['project_id', 'project_name', 'status']
        }
      ],
      order: [['priority', 'DESC'], ['dueDate', 'ASC']]
    });
  }

  static async findOverdueTasks() {
    return this.findAll({
      where: {
        dueDate: {
          [sequelize.Op.lt]: new Date()
        },
        status: {
          [sequelize.Op.ne]: 'completed'
        }
      },
      include: [
        {
          model: sequelize.models.User,
          as: 'assignedUser',
          attributes: ['user_id', 'name', 'email']
        },
        {
          model: sequelize.models.Project,
          as: 'project',
          attributes: ['project_id', 'project_name']
        }
      ]
    });
  }
}

Task.init({
  task_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'project_id'
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
  task_name: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [2, 255]
    }
  },
  task_details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'medium'
  },
  estimate_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'dueDate'
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'userinfos',
      key: 'user_id'
    }
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'userinfos',
      key: 'user_id'
    }
  }
}, {
  sequelize,
  modelName: 'Task',
  tableName: 'tasks',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['project_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_by']
    }
  ]
});

module.exports = Task;
