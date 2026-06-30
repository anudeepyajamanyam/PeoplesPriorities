import axios from 'axios';
import { auth } from '../firebase';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
});

// Request interceptor to attach Firebase JWT dynamically
instance.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("Failed to retrieve Firebase ID token", e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Named API client methods matching specs
export const getConstituencies = () => instance.get('/api/constituencies').then(r => r.data);

export const submitText = (payload) => instance.post('/api/submissions/text', payload).then(r => r.data);

export const submitVoice = (formData) => instance.post('/api/submissions/voice', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then(r => r.data);

export const submitPhoto = (formData) => instance.post('/api/submissions/photo', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then(r => r.data);

export const getSubmissionStatus = (id) => instance.get(`/api/submissions/status/${id}`).then(r => r.data);

export const getPriorities = (constituencyId) => instance.get(`/api/priorities?constituencyId=${constituencyId}`).then(r => r.data);

export const approvePriority = (id) => instance.post(`/api/priorities/${id}/approve`).then(r => r.data);
export const flagPriority = (id) => instance.post(`/api/priorities/${id}/flag`).then(r => r.data);
export const upvotePriority = (id) => instance.post(`/api/priorities/${id}/upvote`).then(r => r.data);

export const getThemes = (constituencyId) => instance.get(`/api/themes?constituencyId=${constituencyId}`).then(r => r.data);

export const getHeatmap = (constituencyId) => instance.get(`/api/themes/heatmap?constituencyId=${constituencyId}`).then(r => r.data);

export const getThemeSubmissions = (themeId, page = 0, size = 10) =>
  instance.get(`/api/themes/${themeId}/submissions?page=${page}&size=${size}`).then(r => r.data);

export const getDashboardStats = (constituencyId) => instance.get(`/api/dashboard/stats?constituencyId=${constituencyId}`).then(r => r.data);

export const triggerPipeline = (constituencyId) => instance.post(`/api/dashboard/admin/trigger-pipeline?constituencyId=${constituencyId}`).then(r => r.data);

export default instance;
