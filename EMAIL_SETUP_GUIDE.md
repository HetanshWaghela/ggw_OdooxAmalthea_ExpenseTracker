# 📧 Email Service Setup Guide

## 🚀 Quick Setup with Gmail (FREE)

### Step 1: Enable 2-Factor Authentication on Gmail
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click "Security" in the left sidebar
3. Under "Signing in to Google", click "2-Step Verification"
4. Follow the setup process to enable 2FA

### Step 2: Generate App Password
1. Still in Google Account Settings → Security
2. Under "Signing in to Google", click "App passwords"
3. Select "Mail" as the app
4. Select "Other" as the device and name it "Expense Tracker"
5. Copy the generated 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 3: Update Your .env File
Add these lines to your `/server/.env` file:

```env
# Email Configuration (Gmail)
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_APP_PASSWORD=abcd efgh ijkl mnop
FRONTEND_URL=http://localhost:5173
```

### Step 4: Test the Setup
1. Restart your server: `npm run dev`
2. Try the "Forgot Password" feature
3. Check your Gmail inbox for the reset email

## 🔧 Alternative Free Email Services

### Option 1: SendGrid (Free Tier: 100 emails/day)
```bash
npm install @sendgrid/mail
```

Update `emailService.js`:
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, text, html) => {
  const msg = {
    to: to,
    from: process.env.EMAIL_FROM,
    subject: subject,
    text: text,
    html: html
  };
  
  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### Option 2: Mailgun (Free Tier: 5,000 emails/month)
```bash
npm install mailgun-js
```

### Option 3: AWS SES (Free Tier: 62,000 emails/month)
```bash
npm install aws-sdk
```

## 🛠️ Troubleshooting

### Common Issues:

1. **"Invalid login" error**
   - Make sure you're using App Password, not your regular Gmail password
   - Ensure 2FA is enabled on your Gmail account

2. **"Less secure app access" error**
   - This is normal with Gmail - use App Passwords instead

3. **Emails going to spam**
   - Add your domain to Gmail's trusted senders
   - Use a professional "from" address

4. **Rate limiting**
   - Gmail has daily limits (500 emails/day for free accounts)
   - Consider upgrading to a paid service for production

## 📊 Email Templates

The system includes beautiful HTML email templates for:
- ✅ Password reset requests
- ✅ New password notifications
- ✅ Professional styling with your branding

## 🔒 Security Best Practices

1. **Never commit .env files** to version control
2. **Use App Passwords** instead of regular passwords
3. **Rotate passwords** regularly
4. **Monitor email logs** for suspicious activity
5. **Use HTTPS** in production

## 🚀 Production Deployment

For production, consider:
- **Dedicated email service** (SendGrid, Mailgun, AWS SES)
- **Custom domain** for professional emails
- **Email analytics** and delivery tracking
- **Backup email service** for redundancy

---

## ✅ Your Setup is Complete!

Your expense tracker now has a fully functional email system that can:
- Send password reset links
- Send new passwords to users
- Handle all email communications professionally

Test it out and let me know if you need any adjustments! 🎉
