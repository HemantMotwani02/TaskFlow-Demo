import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

export const fetchMyNotifications = async ({ page = 1, limit = 20, unread = false, startDate, endDate } = {}) => {
  const res = await api.get(`/notifications`, {
    params: { page, limit, unread, startDate, endDate },
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  return res.data?.data?.notifications || [];
};

export const markNotificationsRead = async (ids) => {
  await api.post(`/notifications/mark-read`, { ids }, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
};

