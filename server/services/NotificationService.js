const supabase = require('../utils/supabase');

class NotificationService {
  // Create a new notification
  static async createNotification({
    userId,
    companyId,
    type,
    title,
    message,
    data = null
  }) {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          company_id: companyId,
          type,
          title,
          message,
          data
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return { success: false, error: error.message };
      }

      return { success: true, notification };
    } catch (error) {
      console.error('Notification creation error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get notifications for a user
  static async getUserNotifications(userId, limit = 50, offset = 0) {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching notifications:', error);
        return { success: false, error: error.message };
      }

      return { success: true, notifications };
    } catch (error) {
      console.error('Notification fetch error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get unread notification count
  static async getUnreadCount(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching unread count:', error);
        return { success: false, error: error.message };
      }

      return { success: true, count: data.length };
    } catch (error) {
      console.error('Unread count error:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark notifications as read
  static async markAsRead(userId, notificationIds) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .in('id', notificationIds);

      if (error) {
        console.error('Error marking notifications as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Mark as read error:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Mark all as read error:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete old notifications (cleanup)
  static async deleteOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('Error deleting old notifications:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete old notifications error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Notification templates and triggers
class NotificationTriggers {
  // Expense submitted notification
  static async expenseSubmitted(expense, approverIds) {
    const promises = approverIds.map(approverId => 
      NotificationService.createNotification({
        userId: approverId,
        companyId: expense.company_id,
        type: 'expense_submitted',
        title: 'New Expense Submitted',
        message: `${expense.employee_name} submitted an expense of ${expense.amount_in_base_currency} ${expense.currency} for approval.`,
        data: {
          expense_id: expense.id,
          employee_id: expense.employee_id,
          amount: expense.amount_in_base_currency,
          currency: expense.currency
        }
      })
    );

    return Promise.all(promises);
  }

  // Expense approved notification
  static async expenseApproved(expense, approverName) {
    return NotificationService.createNotification({
      userId: expense.employee_id,
      companyId: expense.company_id,
      type: 'expense_approved',
      title: 'Expense Approved',
      message: `Your expense of ${expense.amount_in_base_currency} ${expense.currency} has been approved by ${approverName}.`,
      data: {
        expense_id: expense.id,
        amount: expense.amount_in_base_currency,
        currency: expense.currency,
        approver_name: approverName
      }
    });
  }

  // Expense rejected notification
  static async expenseRejected(expense, approverName, reason) {
    return NotificationService.createNotification({
      userId: expense.employee_id,
      companyId: expense.company_id,
      type: 'expense_rejected',
      title: 'Expense Rejected',
      message: `Your expense of ${expense.amount_in_base_currency} ${expense.currency} has been rejected by ${approverName}. ${reason ? `Reason: ${reason}` : ''}`,
      data: {
        expense_id: expense.id,
        amount: expense.amount_in_base_currency,
        currency: expense.currency,
        approver_name: approverName,
        reason
      }
    });
  }

  // User added notification
  static async userAdded(userId, companyId, addedByName, newUserRole) {
    return NotificationService.createNotification({
      userId,
      companyId,
      type: 'user_added',
      title: 'Welcome to the Team!',
      message: `You've been added to the company by ${addedByName}. Your role is ${newUserRole}.`,
      data: {
        added_by: addedByName,
        role: newUserRole
      }
    });
  }

  // Password sent notification
  static async passwordSent(userId, companyId, adminName) {
    return NotificationService.createNotification({
      userId,
      companyId,
      type: 'password_sent',
      title: 'New Password Sent',
      message: `A new password has been sent to your email by ${adminName}. Please check your inbox.`,
      data: {
        admin_name: adminName
      }
    });
  }

  // Approval rule updated notification
  static async approvalRuleUpdated(userId, companyId, adminName) {
    return NotificationService.createNotification({
      userId,
      companyId,
      type: 'approval_rule_updated',
      title: 'Approval Rules Updated',
      message: `The approval rules have been updated by ${adminName}. Please review the changes.`,
      data: {
        admin_name: adminName
      }
    });
  }
}

module.exports = { NotificationService, NotificationTriggers };
