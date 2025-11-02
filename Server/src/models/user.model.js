const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/database');

class User extends Model {
  // Instance methods
  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  generateAuthToken() {
    return jwt.sign(
      { userId: this.user_id, email: this.email, role: this.role },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.password;
    delete values.token;
    return values;
  }

  // Static methods
  static async findByEmail(email) {
    return this.findOne({ where: { email } });
  }

  static async findManagers() {
    return this.findAll({ 
      where: { role: 'manager', isActive: true },
      attributes: ['user_id', 'name', 'email']
    });
  }

  static async findActiveUsers() {
    return this.findAll({ 
      where: { isActive: true },
      attributes: ['user_id', 'name', 'email', 'role']
    });
  }
}

User.init({
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [2, 100]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [6, 255]
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'developer'),
    allowNull: true,
    defaultValue: 'developer'
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^[\+]?[1-9][\d]{0,15}$/i
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 1000]
    }
  },
  profile: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'isActive'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'lastLoginAt'
  },
  token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'userinfos',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['role']
    },
    {
      fields: ['isActive']
    }
  ],
  hooks: {
    // Hash password before save
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    
    // Update lastLoginAt on login
    afterUpdate: async (user) => {
      if (user.changed('token')) {
        user.lastLoginAt = new Date();
        await user.save({ hooks: false });
      }
    }
  }
});

module.exports = User;
