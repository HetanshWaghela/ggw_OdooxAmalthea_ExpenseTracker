const express = require('express');
const supabase = require('../utils/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ocrService = require('../services/ocrService');
const { NotificationTriggers } = require('../services/NotificationService');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Get all expenses
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('expenses')
      .select(`
        *,
        employees:employee_id (
          id,
          first_name,
          last_name,
          email
        ),
        categories:category_id (
          id,
          name
        )
      `)
      .eq('company_id', req.user.company_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // If user is employee, only show their expenses
    if (req.user.role === 'employee') {
      query = query.eq('employee_id', req.user.id);
    }

    // If user is manager, show their team's expenses
    if (req.user.role === 'manager') {
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id')
        .eq('manager_id', req.user.id);

      const teamIds = teamMembers?.map(member => member.id) || [];
      teamIds.push(req.user.id); // Include manager's own expenses
      
      query = query.in('employee_id', teamIds);
    }

    const { data: expenses, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch expenses' });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('expenses')
      .select('id', { count: 'exact' })
      .eq('company_id', req.user.company_id);

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    if (req.user.role === 'employee') {
      countQuery = countQuery.eq('employee_id', req.user.id);
    }

    if (req.user.role === 'manager') {
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id')
        .eq('manager_id', req.user.id);

      const teamIds = teamMembers?.map(member => member.id) || [];
      teamIds.push(req.user.id);
      
      countQuery = countQuery.in('employee_id', teamIds);
    }

    const { count } = await countQuery;

    res.json({
      expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload receipt file
router.post('/upload-receipt', authenticateToken, upload.single('receipt'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      message: 'File uploaded successfully',
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: `/uploads/receipts/${req.file.filename}`
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Process receipt with OCR
router.post('/process-receipt', authenticateToken, upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const mimeType = req.file.mimetype;

    console.log('Processing receipt:', filePath, 'Type:', mimeType);

    // Process the receipt with OCR
    const ocrResult = await ocrService.processReceipt(filePath, mimeType);

    res.json({
      message: 'Receipt processed successfully',
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: `/uploads/receipts/${req.file.filename}`,
      ocrData: ocrResult
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process receipt with OCR',
      details: error.message 
    });
  }
});

// Process existing uploaded receipt with OCR
router.post('/process-existing-receipt', authenticateToken, async (req, res) => {
  try {
    const { filePath, mimeType } = req.body;

    if (!filePath || !mimeType) {
      return res.status(400).json({ error: 'File path and MIME type are required' });
    }

    // Construct full file path
    const fullPath = path.join(__dirname, '..', filePath);

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch (error) {
      return res.status(404).json({ error: 'File not found' });
    }

    console.log('Processing existing receipt:', fullPath, 'Type:', mimeType);

    // Process the receipt with OCR
    const ocrResult = await ocrService.processReceipt(fullPath, mimeType);

    res.json({
      message: 'Receipt processed successfully',
      ocrData: ocrResult
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process receipt with OCR',
      details: error.message 
    });
  }
});

// Create new expense
router.post('/', authenticateToken, requireRole(['employee', 'admin']), async (req, res) => {
  try {
    const {
      description,
      categoryId,
      amount,
      currency,
      paidBy,
      remarks,
      receiptUrl
    } = req.body;

    // Get company base currency
    const { data: company } = await supabase
      .from('companies')
      .select('base_currency')
      .eq('id', req.user.company_id)
      .single();

    // Convert amount to base currency
    let amountInBaseCurrency = amount;
    if (currency !== company.base_currency) {
      const conversionRate = await getCurrencyRate(currency, company.base_currency);
      amountInBaseCurrency = amount * conversionRate;
    }

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        employee_id: req.user.id,
        company_id: req.user.company_id,
        description,
        category_id: categoryId,
        amount,
        currency,
        amount_in_base_currency: amountInBaseCurrency,
        paid_by: paidBy,
        remarks,
        receipt_url: receiptUrl,
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create expense' });
    }

    res.status(201).json({
      message: 'Expense created successfully',
      expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update expense
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      description,
      categoryId,
      amount,
      currency,
      paidBy,
      remarks,
      receiptUrl
    } = req.body;

    // Check if expense exists and user has permission
    const { data: existingExpense } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('company_id', req.user.company_id)
      .single();

    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Only allow updates if user is the owner or admin, and status is draft
    if (existingExpense.employee_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    if (existingExpense.status !== 'draft') {
      return res.status(400).json({ error: 'Cannot update submitted expense' });
    }

    // Get company base currency
    const { data: company } = await supabase
      .from('companies')
      .select('base_currency')
      .eq('id', req.user.company_id)
      .single();

    // Convert amount to base currency
    let amountInBaseCurrency = amount;
    if (currency !== company.base_currency) {
      const conversionRate = await getCurrencyRate(currency, company.base_currency);
      amountInBaseCurrency = amount * conversionRate;
    }

    const { data: expense, error } = await supabase
      .from('expenses')
      .update({
        description,
        category_id: categoryId,
        amount,
        currency,
        amount_in_base_currency: amountInBaseCurrency,
        paid_by: paidBy,
        remarks,
        receipt_url: receiptUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update expense' });
    }

    res.json({
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit expense for approval
router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if expense exists and user has permission
    const { data: expense } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('company_id', req.user.company_id)
      .single();

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (expense.employee_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    if (expense.status !== 'draft') {
      return res.status(400).json({ error: 'Expense already submitted' });
    }

    // Update expense status
    await supabase
      .from('expenses')
      .update({
        status: 'submitted',
        submission_date: new Date().toISOString()
      })
      .eq('id', id);

    // Create approval requests based on approval rules
    await createApprovalRequests(id, expense.employee_id);

    // Send notifications to approvers
    try {
      // Get approvers for this expense
      const { data: approvals } = await supabase
        .from('approvals')
        .select(`
          approver_id,
          users:approver_id (
            first_name,
            last_name
          )
        `)
        .eq('expense_id', id);

      if (approvals && approvals.length > 0) {
        const approverIds = approvals.map(a => a.approver_id);
        const employeeName = `${req.user.first_name} ${req.user.last_name}`;
        
        // Create notification data
        const notificationData = {
          ...expense,
          employee_name: employeeName,
          currency: expense.currency || 'USD'
        };

        await NotificationTriggers.expenseSubmitted(notificationData, approverIds);
      }
    } catch (notificationError) {
      console.error('Failed to send expense submission notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    res.json({ message: 'Expense submitted for approval' });
  } catch (error) {
    console.error('Submit expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get expense categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to get currency rate
async function getCurrencyRate(fromCurrency, toCurrency) {
  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const data = await response.json();
    return data.rates[toCurrency] || 1;
  } catch (error) {
    console.error('Currency conversion error:', error);
    return 1;
  }
}

// Helper function to create approval requests
async function createApprovalRequests(expenseId, employeeId) {
  try {
    console.log('Creating approval requests for expense:', expenseId, 'employee:', employeeId);
    
    // Get employee's manager
    const { data: employee } = await supabase
      .from('users')
      .select('manager_id, company_id')
      .eq('id', employeeId)
      .single();

    let approverId = null;

    if (employee?.manager_id) {
      // Use employee's manager
      approverId = employee.manager_id;
      console.log('Using employee manager:', approverId);
    } else {
      // Fallback: Find an admin in the same company
      const { data: admin } = await supabase
        .from('users')
        .select('id')
        .eq('company_id', employee.company_id)
        .eq('role', 'admin')
        .limit(1)
        .single();
      
      if (admin) {
        approverId = admin.id;
        console.log('Using company admin as approver:', approverId);
      } else {
        console.log('No manager or admin found for approval');
        return;
      }
    }

    // Create approval request
    const { error: insertError } = await supabase
      .from('approval_requests')
      .insert({
        expense_id: expenseId,
        approver_id: approverId,
        status: 'pending'
      });

    if (insertError) {
      console.error('Failed to create approval request:', insertError);
    } else {
      console.log('✅ Approval request created successfully');
    }

    // Also check for approval rules (for future use)
    const { data: rules } = await supabase
      .from('approval_rules')
      .select(`
        *,
        approvers (
          user_id,
          sequence_order
        )
      `)
      .eq('user_id', employeeId);

    for (const rule of rules || []) {
      for (const approver of rule.approvers || []) {
        await supabase
          .from('approval_requests')
          .insert({
            expense_id: expenseId,
            approver_id: approver.user_id,
            status: 'pending'
          });
      }
    }
  } catch (error) {
    console.error('Create approval requests error:', error);
  }
}

// Approve expense
router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    // Check if expense exists
    const { data: expense } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('company_id', req.user.company_id)
      .single();

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (expense.status !== 'submitted') {
      return res.status(400).json({ error: 'Expense is not submitted for approval' });
    }

    // Check if user has permission to approve
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Update expense status
    const { error: updateError } = await supabase
      .from('expenses')
      .update({
        status: 'approved'
      })
      .eq('id', id);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to approve expense' });
    }

    // Update approval requests
    await supabase
      .from('approval_requests')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        comments: comments || ''
      })
      .eq('expense_id', id)
      .eq('approver_id', req.user.id);

    res.json({
      message: 'Expense approved successfully',
      expense: { ...expense, status: 'approved' }
    });
  } catch (error) {
    console.error('Approve expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject expense
router.post('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    // Check if expense exists
    const { data: expense } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('company_id', req.user.company_id)
      .single();

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (expense.status !== 'submitted') {
      return res.status(400).json({ error: 'Expense is not submitted for approval' });
    }

    // Check if user has permission to reject
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Update expense status
    const { error: updateError } = await supabase
      .from('expenses')
      .update({
        status: 'rejected'
      })
      .eq('id', id);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to reject expense' });
    }

    // Update approval requests
    await supabase
      .from('approval_requests')
      .update({
        status: 'rejected',
        approved_at: new Date().toISOString(),
        comments: comments || ''
      })
      .eq('expense_id', id)
      .eq('approver_id', req.user.id);

    res.json({
      message: 'Expense rejected successfully',
      expense: { ...expense, status: 'rejected' }
    });
  } catch (error) {
    console.error('Reject expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete expense
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if expense exists and user has permission
    const { data: expense, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('company_id', req.user.company_id)
      .single();

    if (error || !expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Only allow deletion of draft expenses
    if (expense.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft expenses can be deleted' });
    }

    // Check if user has permission to delete (employee can delete their own, admin can delete any)
    if (expense.employee_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Delete the expense
    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete expense error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete expense' });
    }

    res.json({
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
