const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Log extends Model {
  // Instance methods
  getTotalHours() {
    return (this.hours || 0) + (this.minutes || 0) / 60;
  }

  getFormattedTime() {
    // Calculate from start_time and end_time if available
    if (this.start_time && this.end_time) {
      try {
        const start = new Date(`2000-01-01T${this.start_time}`);
        const end = new Date(`2000-01-01T${this.end_time}`);
        
        // Handle case where end time is next day
        if (end < start) {
          end.setDate(end.getDate() + 1);
        }
        
        const diffMs = end - start;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        // Use Math.round for minutes to handle floating-point precision issues
        const diffMinutes = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${diffHours}h ${diffMinutes}m`;
      } catch (error) {
        console.error('Error calculating formatted time:', error);
        return '0h 0m';
      }
    }
    
    // Fallback to hours and minutes if available
    const hours = this.hours || 0;
    const minutes = this.minutes || 0;
    return `${hours}h ${minutes}m`;
  }

  toJSON() {
    const values = { ...this.get() };
    
    // Debug: Log the available fields
    console.log('Log toJSON - available fields:', Object.keys(values));
    console.log('Log toJSON - created_at value:', this.created_at || this.createdAt);
    
    // Remove createdAt and updatedAt from response
    delete values.createdAt;
    delete values.updatedAt;
    delete values.created_at;
    delete values.updated_at;
    
    // Add calculated fields
    values.totalHours = this.getTotalHours();
    values.formattedTime = this.getFormattedTime();
    
    // Add log_date field with date in dd/mm/yyyy format from created_at
    const createdAtValue = this.created_at || this.createdAt || values.created_at || values.createdAt;
    if (createdAtValue) {
      try {
        const date = new Date(createdAtValue);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          values.log_date = `${day}/${month}/${year}`; // Format: dd/mm/yyyy
          console.log('Log toJSON - set log_date:', values.log_date);
        } else {
          console.warn('Log toJSON - invalid date:', createdAtValue);
          values.log_date = 'Invalid date';
        }
      } catch (error) {
        console.error('Log toJSON - error formatting date:', error);
        values.log_date = 'Error';
      }
    } else {
      console.warn('Log toJSON - no created_at field found');
      values.log_date = 'No date';
    }
    
    return values;
  }

  // Static methods
  static async findLogsByTask(taskId) {
    return this.findAll({
      where: { task_id: taskId },
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['user_id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  static async findLogsByUser(userId, startDate, endDate) {
    const whereClause = { user_id: userId };
    if (startDate && endDate) {
      whereClause.created_at = {
        [sequelize.Op.between]: [startDate, endDate]
      };
    }

    return this.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.Task,
          as: 'task',
          attributes: ['task_id', 'task_name', 'project_id'],
          include: [
            {
              model: sequelize.models.Project,
              as: 'project',
              attributes: ['project_id', 'project_name']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  static async getTotalTimeByUser(userId, startDate, endDate) {
    const whereClause = { user_id: userId };
    if (startDate && endDate) {
      whereClause.created_at = {
        [sequelize.Op.between]: [startDate, endDate]
      };
    }

    const result = await this.findOne({
      where: whereClause,
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_minutes')), 'totalMinutes']
      ]
    });

    return result ? result.getDataValue('totalMinutes') || 0 : 0;
  }
}

Log.init({
  log_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'userinfos',
      key: 'user_id'
    }
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'project_id'
    }
  },
  task_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tasks',
      key: 'task_id'
    }
  },
  logdata: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  logstatus: {
    type: DataTypes.STRING,
    allowNull: true
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'userinfos',
      key: 'user_id'
    }
  }
}, {
  sequelize,
  modelName: 'Log',
  tableName: 'logs',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['task_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['project_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['approved_by']
    }
  ]
});

module.exports = Log;
