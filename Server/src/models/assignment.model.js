const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Assignment extends Model {
  // Instance methods
  toJSON() {
    const values = { ...this.get() };
    return values;
  }

  // Static methods
  static async findAssignmentsByProject(projectId) {
    return this.findAll({
      where: { project_id: projectId },
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['user_id', 'name', 'email', 'role']
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  static async findAssignmentsByUser(userId) {
    return this.findAll({
      where: { user_id: userId },
      include: [
        {
          model: sequelize.models.Project,
          as: 'project',
          attributes: ['project_id', 'project_name', 'status']
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  static async findActiveAssignments() {
    return this.findAll({
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['user_id', 'name', 'email', 'role']
        },
        {
          model: sequelize.models.Project,
          as: 'project',
          attributes: ['project_id', 'project_name', 'status']
        }
      ]
    });
  }
}

Assignment.init({
  assignment_id: {
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
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'userinfos',
      key: 'user_id'
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
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'Assignment',
  tableName: 'assignments',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['project_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['manager_id']
    }
  ]
});

module.exports = Assignment;
