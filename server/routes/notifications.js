import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { NotificationService } from '../services/NotificationService.js';

const router = express.Router();

// Get user's notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.user.id;

    const result = await NotificationService.getUserNotifications(
      userId, 
      parseInt(limit), 
      parseInt(offset)
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      notifications: result.notifications,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: result.notifications.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread notification count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await NotificationService.getUnreadCount(userId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ count: result.count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark specific notifications as read
router.patch('/mark-read', authenticateToken, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.user.id;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ error: 'Notification IDs array is required' });
    }

    const result = await NotificationService.markAsRead(userId, notificationIds);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await NotificationService.markAllAsRead(userId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete notification error:', error);
      return res.status(500).json({ error: 'Failed to delete notification' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
