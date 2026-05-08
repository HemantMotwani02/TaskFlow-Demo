const { Resend } = require('resend');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    // Initialize Resend with API key from environment
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      logger.warn('⚠️ RESEND_API_KEY not found in environment variables. Email service will not work.');
      logger.warn('Please set RESEND_API_KEY in your .env file to enable email functionality.');
      this.resend = null;
    } else {
      this.resend = new Resend(apiKey);
      logger.info('✅ Resend email service initialized successfully');
    }
  }

  /**
   * Send OTP email to user
   * @param {string} email - Recipient email
   * @param {string} otpCode - 6-digit OTP code
   * @param {number} expiryMinutes - OTP expiry time in minutes
   */
  async sendOTPEmail(email, otpCode, expiryMinutes = 10) {
    if (!this.resend) {
      const error = 'Email service not configured. Please set RESEND_API_KEY in environment variables.';
      logger.error(error);
      throw new Error(error);
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'TaskFlow <onboarding@resend.dev>',
        to: [email],
        subject: 'Password Reset OTP - TaskFlow',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
              }
              .container {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                padding: 40px 30px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
              }
              .content {
                background: white;
                border-radius: 10px;
                padding: 40px 30px;
                margin-top: 20px;
              }
              .header {
                text-align: center;
                color: white;
                margin-bottom: 20px;
              }
              .header h1 {
                margin: 0;
                font-size: 32px;
                font-weight: 700;
              }
              .header p {
                margin: 10px 0 0 0;
                font-size: 16px;
                opacity: 0.95;
              }
              .otp-code {
                background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                border: 3px dashed #667eea;
                border-radius: 12px;
                padding: 30px 20px;
                text-align: center;
                margin: 30px 0;
              }
              .otp-code-label {
                color: #666;
                font-size: 14px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin: 0 0 15px 0;
              }
              .otp-code h2 {
                color: #667eea;
                font-size: 48px;
                margin: 0;
                letter-spacing: 12px;
                font-weight: 800;
                font-family: 'Courier New', monospace;
              }
              .otp-code-expiry {
                color: #666;
                font-size: 14px;
                margin: 15px 0 0 0;
                font-weight: 500;
              }
              .warning {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 16px;
                margin: 25px 0;
                border-radius: 6px;
              }
              .warning strong {
                color: #856404;
                display: block;
                margin-bottom: 8px;
              }
              .warning p {
                margin: 0;
                color: #856404;
                font-size: 14px;
              }
              .info-list {
                margin: 25px 0;
                padding: 0;
              }
              .info-list li {
                margin: 12px 0;
                padding-left: 10px;
                font-size: 15px;
                line-height: 1.6;
              }
              .footer {
                text-align: center;
                color: white;
                margin-top: 30px;
                font-size: 14px;
              }
              .footer p {
                margin: 8px 0;
                opacity: 0.9;
              }
              .footer-small {
                font-size: 12px;
                opacity: 0.8;
              }
              .divider {
                border-top: 1px solid #e0e0e0;
                margin: 25px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 TaskFlow</h1>
                <p>Password Reset Request</p>
              </div>
              
              <div class="content">
                <h2 style="margin-top: 0; color: #333; font-size: 24px;">Hello!</h2>
                <p style="font-size: 16px; color: #555;">
                  We received a request to reset your password. Use the verification code below to proceed with your password reset:
                </p>
                
                <div class="otp-code">
                  <p class="otp-code-label">Your Verification Code</p>
                  <h2>${otpCode}</h2>
                  <p class="otp-code-expiry">⏱️ Valid for ${expiryMinutes} minutes</p>
                </div>
                
                <p style="font-size: 15px; color: #555;">
                  Enter this code on the verification page to reset your password. This code will expire in ${expiryMinutes} minutes for your security.
                </p>
                
                <div class="warning">
                  <strong>⚠️ Security Notice</strong>
                  <p>If you didn't request this password reset, please ignore this email. Your account remains secure and no changes have been made.</p>
                </div>
                
                <div class="divider"></div>
                
                <p style="margin-bottom: 10px; color: #333; font-weight: 600;">Important Security Tips:</p>
                <ul class="info-list">
                  <li>✅ This code expires in ${expiryMinutes} minutes</li>
                  <li>🔒 Never share this code with anyone</li>
                  <li>🚫 TaskFlow staff will never ask for your OTP</li>
                  <li>📧 This email was sent to: ${email}</li>
                </ul>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 25px;">
                  <p style="margin: 0; font-size: 13px; color: #666; text-align: center;">
                    Having trouble? Please contact our support team for assistance.
                  </p>
                </div>
              </div>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} TaskFlow. All rights reserved.</p>
                <p class="footer-small">This is an automated message, please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      if (error) {
        logger.error(`❌ Failed to send OTP email to ${email}:`, error);
        throw new Error(`Email sending failed: ${error.message}`);
      }

      logger.info(`✅ OTP email sent successfully to ${email} (ID: ${data?.id || 'N/A'})`);
      return { success: true, messageId: data?.id };
    } catch (error) {
      logger.error(`❌ Exception while sending OTP email to ${email}:`, error);
      throw new Error('Failed to send OTP email. Please try again later.');
    }
  }

  /**
   * Send password reset confirmation email
   * @param {string} email - Recipient email
   * @param {string} userName - User's name
   */
  async sendPasswordResetConfirmation(email, userName) {
    if (!this.resend) {
      logger.warn('⚠️ Email service not configured. Skipping confirmation email.');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'TaskFlow <onboarding@resend.dev>',
        to: [email],
        subject: 'Password Successfully Reset - TaskFlow',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
              }
              .container {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                border-radius: 12px;
                padding: 40px 30px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
              }
              .content {
                background: white;
                border-radius: 10px;
                padding: 40px 30px;
                margin-top: 20px;
              }
              .header {
                text-align: center;
                color: white;
                margin-bottom: 20px;
              }
              .header h1 {
                margin: 0;
                font-size: 32px;
                font-weight: 700;
              }
              .success-icon {
                text-align: center;
                font-size: 80px;
                margin: 20px 0 30px 0;
                line-height: 1;
              }
              .warning {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 16px;
                margin: 25px 0;
                border-radius: 6px;
              }
              .warning strong {
                color: #856404;
                display: block;
                margin-bottom: 8px;
              }
              .warning p {
                margin: 0;
                color: #856404;
                font-size: 14px;
              }
              .info-list {
                margin: 25px 0;
                padding: 0;
              }
              .info-list li {
                margin: 12px 0;
                padding-left: 10px;
                font-size: 15px;
                line-height: 1.6;
              }
              .footer {
                text-align: center;
                color: white;
                margin-top: 30px;
                font-size: 14px;
              }
              .footer p {
                margin: 8px 0;
                opacity: 0.9;
              }
              .footer-small {
                font-size: 12px;
                opacity: 0.8;
              }
              .divider {
                border-top: 1px solid #e0e0e0;
                margin: 25px 0;
              }
              .success-box {
                background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
                border: 2px solid #10b981;
                border-radius: 10px;
                padding: 20px;
                text-align: center;
                margin: 25px 0;
              }
              .success-box h3 {
                color: #047857;
                margin: 0 0 10px 0;
                font-size: 20px;
              }
              .success-box p {
                color: #065f46;
                margin: 0;
                font-size: 15px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ TaskFlow</h1>
              </div>
              
              <div class="content">
                <div class="success-icon">🎉</div>
                <h2 style="margin-top: 0; color: #333; font-size: 28px; text-align: center;">
                  Password Reset Successful!
                </h2>
                
                <div class="success-box">
                  <h3>✓ All Set!</h3>
                  <p>Your password has been successfully updated</p>
                </div>
                
                <p style="font-size: 16px; color: #555;">
                  Hello ${userName || 'there'}! 👋
                </p>
                
                <p style="font-size: 15px; color: #555;">
                  This is to confirm that your TaskFlow account password has been successfully reset. You can now log in to your account using your new password.
                </p>
                
                <div class="warning">
                  <strong>⚠️ Security Alert</strong>
                  <p>If you didn't make this change, please contact our support team immediately. Your account security is our top priority.</p>
                </div>
                
                <div class="divider"></div>
                
                <p style="margin-bottom: 10px; color: #333; font-weight: 600;">Security Best Practices:</p>
                <ul class="info-list">
                  <li>🔐 Never share your password with anyone</li>
                  <li>💪 Use a strong, unique password</li>
                  <li>🔄 Change your password regularly</li>
                  <li>🛡️ Enable two-factor authentication for added security</li>
                  <li>📱 Keep your account recovery information up to date</li>
                </ul>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 25px; text-align: center;">
                  <p style="margin: 0 0 15px 0; font-size: 15px; color: #333; font-weight: 600;">
                    Need Help?
                  </p>
                  <p style="margin: 0; font-size: 14px; color: #666;">
                    If you have any questions or concerns, please don't hesitate to contact our support team.
                  </p>
                </div>
              </div>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} TaskFlow. All rights reserved.</p>
                <p class="footer-small">This is an automated message, please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      if (error) {
        logger.error(`❌ Failed to send confirmation email to ${email}:`, error);
        return { success: false, error: error.message };
      }

      logger.info(`✅ Password reset confirmation sent to ${email} (ID: ${data?.id || 'N/A'})`);
      return { success: true, messageId: data?.id };
    } catch (error) {
      logger.error(`❌ Exception while sending confirmation email to ${email}:`, error);
      // Don't throw error for confirmation email - it's not critical
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
