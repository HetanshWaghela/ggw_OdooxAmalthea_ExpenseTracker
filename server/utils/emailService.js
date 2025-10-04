const nodemailer = require('nodemailer');

// Create reusable transporter object using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password (not your regular password)
    }
  });
};

// Send email function
const sendEmail = async (to, subject, text, html = null) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      text: text,
      html: html || text.replace(/\n/g, '<br>') // Convert line breaks to HTML
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (userEmail, userName, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
  
  const subject = 'Password Reset Request - Expense Tracker';
  const text = `
Hello ${userName},

You requested a password reset for your account. Click the link below to reset your password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
Expense Tracker Team
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Password Reset Request</h2>
      <p>Hello ${userName},</p>
      <p>You requested a password reset for your account. Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
      </div>
      <p><strong>This link will expire in 1 hour.</strong></p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Expense Tracker Team</p>
    </div>
  `;

  return await sendEmail(userEmail, subject, text, html);
};

// Send new password email (admin generated)
const sendNewPasswordEmail = async (userEmail, userName, newPassword) => {
  const subject = 'Your New Password - Expense Tracker';
  const text = `
Hello ${userName},

Your admin has generated a new password for your account. Please use the following credentials to login:

Email: ${userEmail}
Password: ${newPassword}

Please change your password after logging in for security reasons.

Best regards,
Expense Tracker Team
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Your New Password</h2>
      <p>Hello ${userName},</p>
      <p>Your admin has generated a new password for your account. Please use the following credentials to login:</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 3px;">${newPassword}</code></p>
      </div>
      <p style="color: #dc2626;"><strong>Please change your password after logging in for security reasons.</strong></p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Expense Tracker Team</p>
    </div>
  `;

  return await sendEmail(userEmail, subject, text, html);
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendNewPasswordEmail
};
