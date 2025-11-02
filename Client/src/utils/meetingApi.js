import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchMeetings = async () => {
  const res = await api.get('/meetings');
  // Normalize shape
  return res.data?.data || res.data || [];
};

export const createMeeting = async (meeting) => {
  const res = await api.post('/meetings', meeting);
  return res.data?.data || res.data;
};

export const updateMeeting = async (id, meeting) => {
  const res = await api.put(`/meetings/${id}`, meeting);
  return res.data?.data || res.data;
};

export const deleteMeeting = async (id) => {
  const res = await api.delete(`/meetings/${id}`);
  return res.data?.data || res.data;
};

export const updateMeetingStatus = async (id, status) => {
  const res = await api.patch(`/meetings/${id}/status`, { status });
  return res.data?.data || res.data;
};