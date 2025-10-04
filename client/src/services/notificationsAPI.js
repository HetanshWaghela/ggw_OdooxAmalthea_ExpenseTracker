import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth token
const createApiInstance = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });
};

export const notificationsAPI = {
  // Get user's notifications
  getNotifications: async (limit = 50, offset = 0) => {
    try {
      const api = createApiInstance();
      const response = await api.get('/notifications', {
        params: { limit, offset }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404 || error.response?.data?.message?.includes('notifications')) {
        // Return empty notifications if table doesn't exist yet
        return { notifications: [], pagination: { limit, offset, hasMore: false } };
      }
      throw error;
    }
  },

  // Get unread notification count
  getUnreadCount: async () => {
    try {
      const api = createApiInstance();
      const response = await api.get('/notifications/unread-count');
      return response.data;
    } catch (error) {
      if (error.response?.status === 404 || error.response?.data?.message?.includes('notifications')) {
        // Return 0 if table doesn't exist yet
        return { count: 0 };
      }
      throw error;
    }
  },

  // Mark specific notifications as read
  markAsRead: async (notificationIds) => {
    const api = createApiInstance();
    const response = await api.patch('/notifications/mark-read', {
      notificationIds
    });
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const api = createApiInstance();
    const response = await api.patch('/notifications/mark-all-read');
    return response.data;
  },

  // Delete a notification
  deleteNotification: async (notificationId) => {
    const api = createApiInstance();
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  }
};
