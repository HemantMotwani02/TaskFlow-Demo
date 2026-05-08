const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class OTP extends Model {
  // Check if OTP is expired
  isExpired() {
    return new Date() > this.expires_at;
  }

  // Check if OTP is valid
  isValid(code) {
    return !this.is_verified && !this.isExpired() && this.otp_code === code;
  }

  // Static method to generate a random 6-digit OTP
  static generateOTPCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Static method to find valid OTP for email
  static async findValidOTP(email, code) {
    const otp = await this.findOne({
      where: {
        email,
        otp_code: code,
        is_verified: false
      },
      order: [['created_at', 'DESC']]
    });

    if (!otp || otp.isExpired()) {
      return null;
    }

    return otp;
  }

  // Static method to cleanup expired OTPs
  static async cleanupExpired() {
    const now = new Date();
    await this.destroy({
      where: {
        expires_at: {
          [sequelize.Sequelize.Op.lt]: now
        }
      }
    });
  }
}

OTP.init({
  otp_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  otp_code: {
    type: DataTypes.STRING(6),
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'OTP',
  tableName: 'otps',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['email']
    },
    {
      fields: ['otp_code']
    },
    {
      fields: ['expires_at']
    }
  ]
});

module.exports = OTP;

