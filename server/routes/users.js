const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('../utils/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sendNewPasswordEmail } = require('../utils/emailService');

const router = express.Router();

// Generate random password
const generateRandomPassword = () => {
  return crypto.randomBytes(8).toString('hex');
};

// Get all users in company
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        manager_id,
        is_active,
        created_at,
        managers:manager_id (
          id,
          first_name,
          last_name
        )
      `)
      .eq('company_id', req.user.company_id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, managerId } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role,
        company_id: req.user.company_id,
        manager_id: managerId || null
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        managerId: user.manager_id
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, managerId, isActive } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        role,
        manager_id: managerId || null,
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('company_id', req.user.company_id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update user' });
    }

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        managerId: user.manager_id,
        isActive: user.is_active
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get managers for dropdown
router.get('/managers', authenticateToken, async (req, res) => {
  try {
    const { data: managers, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('company_id', req.user.company_id)
      .eq('role', 'manager')
      .eq('is_active', true);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch managers' });
    }

    res.json({ managers });
  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get employees for a manager
router.get('/employees', authenticateToken, async (req, res) => {
  try {
    let query = supabase
      .from('users')
      .select('id, first_name, last_name, email, role')
      .eq('company_id', req.user.company_id)
      .eq('is_active', true);

    // If user is a manager, only show their employees
    if (req.user.role === 'manager') {
      query = query.eq('manager_id', req.user.id);
    }

    const { data: employees, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch employees' });
    }

    res.json({ employees });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send password to user (Admin only)
router.post('/:id/send-password', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const userId = req.params.id;

    // Get user details
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, company_id')
      .eq('id', userId)
      .eq('company_id', req.user.companyId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate random password
    const randomPassword = generateRandomPassword();
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    // Update user password
    await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', userId);

    // Send password email
    const emailResult = await sendNewPasswordEmail(user.email, user.first_name, randomPassword);
    
    if (!emailResult.success) {
      console.error('Failed to send new password email:', emailResult.error);
      return res.status(500).json({ error: 'Failed to send password email' });
    }

    res.json({
      message: 'Password sent successfully to user\'s email'
    });
  } catch (error) {
    console.error('Send password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
