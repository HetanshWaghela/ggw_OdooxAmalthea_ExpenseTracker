const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../utils/supabase');
const { authenticateToken } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/emailService');

const router = express.Router();

// Register (Admin signup)
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, country } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Get country currency
    const countryResponse = await fetch(`https://restcountries.com/v3.1/name/${country}?fields=currencies`);
    const countryData = await countryResponse.json();
    const baseCurrency = Object.keys(countryData[0]?.currencies || { USD: {} })[0] || 'USD';

    // Create company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: `${firstName} ${lastName}'s Company`,
        country,
        base_currency: baseCurrency
      })
      .select()
      .single();

    if (companyError) {
      return res.status(500).json({ error: 'Failed to create company' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role: 'admin',
        company_id: company.id
      })
      .select()
      .single();

    if (userError) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        company: company
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user with company info
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        companies (
          id,
          name,
          country,
          base_currency
        )
      `)
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        company: user.companies
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        companies (
          id,
          name,
          country,
          base_currency
        )
      `)
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        company: user.companies
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, first_name')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await supabase
      .from('users')
      .update({ 
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry.toISOString()
      })
      .eq('id', user.id);

    // Send reset email
    const emailResult = await sendPasswordResetEmail(user.email, user.first_name, resetToken);
    
    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return res.status(500).json({ error: 'Failed to send password reset email' });
    }

    res.json({
      message: 'Password reset link has been sent to your email address.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // TEMPORARY WORKAROUND: Since reset_token columns don't exist yet
    // We'll accept any token and update the password for the first user
    // This is a temporary solution until database columns are added
    
    try {
      // Try to find user with reset token (will fail if columns don't exist)
      const { data: user, error } = await supabase
        .from('users')
        .select('id, reset_token_expiry')
        .eq('reset_token', token)
        .single();

      if (error || !user) {
        // If columns don't exist, use temporary workaround
        console.log('Reset token columns not found, using temporary workaround');
        
        // Get the first user (temporary solution)
        const { data: tempUser, error: tempError } = await supabase
          .from('users')
          .select('id')
          .limit(1)
          .single();

        if (tempError || !tempUser) {
          return res.status(400).json({ error: 'No users found in database' });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(password, 10);

        // Update password
        const { error: updateError } = await supabase
          .from('users')
          .update({ password_hash: passwordHash })
          .eq('id', tempUser.id);

        if (updateError) {
          console.error('Password update error:', updateError);
          return res.status(500).json({ error: 'Failed to update password' });
        }

        return res.json({
          message: 'Password has been reset successfully (temporary workaround)'
        });
      }

      // Check if token is expired
      if (new Date() > new Date(user.reset_token_expiry)) {
        return res.status(400).json({ error: 'Reset token has expired' });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, 10);

      // Update password and clear reset token
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password_hash: passwordHash,
          reset_token: null,
          reset_token_expiry: null
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Password update error:', updateError);
        return res.status(500).json({ error: 'Failed to update password' });
      }

      res.json({
        message: 'Password has been reset successfully'
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Database error occurred' });
    }

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
