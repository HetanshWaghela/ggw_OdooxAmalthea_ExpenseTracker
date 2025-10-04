const express = require('express');
const supabase = require('../utils/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get approvals to review
router.get('/pending', authenticateToken, requireRole(['manager', 'admin']), async (req, res) => {
  try {
    const { data: approvals, error } = await supabase
      .from('approval_requests')
      .select(`
        *,
        expenses:expense_id (
          id,
          description,
          amount,
          currency,
          amount_in_base_currency,
          submission_date,
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
        )
      `)
      .eq('approver_id', req.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch pending approvals' });
    }

    res.json({ approvals });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve expense
router.post('/:id/approve', authenticateToken, requireRole(['manager', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    // Get approval request
    const { data: approvalRequest } = await supabase
      .from('approval_requests')
      .select(`
        *,
        expenses:expense_id (
          id,
          employee_id,
          status
        )
      `)
      .eq('id', id)
      .eq('approver_id', req.user.id)
      .single();

    if (!approvalRequest) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    if (approvalRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Approval request already processed' });
    }

    // Update approval request
    await supabase
      .from('approval_requests')
      .update({
        status: 'approved',
        comments,
        approved_at: new Date().toISOString()
      })
      .eq('id', id);

    // Check if all approvals are complete
    await checkAndUpdateExpenseStatus(approvalRequest.expense_id);

    res.json({ message: 'Expense approved successfully' });
  } catch (error) {
    console.error('Approve expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject expense
router.post('/:id/reject', authenticateToken, requireRole(['manager', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    // Get approval request
    const { data: approvalRequest } = await supabase
      .from('approval_requests')
      .select(`
        *,
        expenses:expense_id (
          id,
          employee_id,
          status
        )
      `)
      .eq('id', id)
      .eq('approver_id', req.user.id)
      .single();

    if (!approvalRequest) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    if (approvalRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Approval request already processed' });
    }

    // Update approval request
    await supabase
      .from('approval_requests')
      .update({
        status: 'rejected',
        comments,
        approved_at: new Date().toISOString()
      })
      .eq('id', id);

    // Reject the expense
    await supabase
      .from('expenses')
      .update({
        status: 'rejected'
      })
      .eq('id', approvalRequest.expense_id);

    res.json({ message: 'Expense rejected successfully' });
  } catch (error) {
    console.error('Reject expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get approval history for an expense
router.get('/expense/:expenseId', authenticateToken, async (req, res) => {
  try {
    const { expenseId } = req.params;

    // Check if user has permission to view this expense
    const { data: expense } = await supabase
      .from('expenses')
      .select('employee_id, company_id')
      .eq('id', expenseId)
      .single();

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (expense.company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    if (req.user.role === 'employee' && expense.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const { data: approvals, error } = await supabase
      .from('approval_requests')
      .select(`
        *,
        approvers:approver_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('expense_id', expenseId)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch approval history' });
    }

    res.json({ approvals });
  } catch (error) {
    console.error('Get approval history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process approval (generic endpoint for approve/reject)
router.post('/:id/process', authenticateToken, requireRole(['manager', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!action || !['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be "approved" or "rejected"' });
    }

    // Get approval request
    const { data: approvalRequest } = await supabase
      .from('approval_requests')
      .select(`
        *,
        expenses:expense_id (
          id,
          employee_id,
          status
        )
      `)
      .eq('id', id)
      .eq('approver_id', req.user.id)
      .single();

    if (!approvalRequest) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    if (approvalRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Approval request already processed' });
    }

    // Update approval request
    await supabase
      .from('approval_requests')
      .update({
        status: action,
        approved_at: new Date().toISOString()
      })
      .eq('id', id);

    if (action === 'rejected') {
      // Reject the expense immediately
      await supabase
        .from('expenses')
        .update({ status: 'rejected' })
        .eq('id', approvalRequest.expense_id);
    } else {
      // Check if all approvals are complete
      await checkAndUpdateExpenseStatus(approvalRequest.expense_id);
    }

    res.json({ 
      message: `Expense ${action} successfully`,
      status: action
    });
  } catch (error) {
    console.error('Process approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to check and update expense status
async function checkAndUpdateExpenseStatus(expenseId) {
  try {
    // Get all approval requests for this expense
    const { data: approvals } = await supabase
      .from('approval_requests')
      .select('status')
      .eq('expense_id', expenseId);

    if (!approvals || approvals.length === 0) {
      return;
    }

    // Check if any approval is rejected
    const hasRejected = approvals.some(approval => approval.status === 'rejected');
    if (hasRejected) {
      await supabase
        .from('expenses')
        .update({ status: 'rejected' })
        .eq('id', expenseId);
      return;
    }

    // Check if all approvals are approved
    const allApproved = approvals.every(approval => approval.status === 'approved');
    if (allApproved) {
      await supabase
        .from('expenses')
        .update({ status: 'approved' })
        .eq('id', expenseId);
    }
  } catch (error) {
    console.error('Check expense status error:', error);
  }
}

module.exports = router;
