import axios from 'axios';
import useAuthStore from '../store/authStore';

const API_BASE_URL = 'http://localhost:5000/api' ;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Student auth
  registerStudent: (data) => api.post('/auth/student/register', data),
  loginStudent: (data) => api.post('/auth/student/login', data),
  
  // Teacher auth
  registerTeacher: (data) => api.post('/auth/teacher/register', data),
  loginTeacher: (data) => api.post('/auth/teacher/login', data),
  
  // Admin auth
  loginAdmin: (data) => api.post('/auth/admin/login', data),
};

// Student API
export const studentAPI = {
  getProfile: () => api.get('/student/profile'),
  updateProject: (data) => api.put('/student/project/update', data),
  editUpdate: (updateId, data) => api.put(`/student/project/update/${updateId}`, data),
  getProgress: () => api.get('/student/project/progress'),
  getDailyUpdates: () => api.get('/student/daily-updates'),
  requestIncharge: (teacherId) => api.post('/student/request/incharge', { teacherId }),
  requestPartner: (partnerRollNo) => api.post('/student/request/partner', { partnerRollNo }),
  respondToPartnerRequest: (requestId, action) => api.post('/student/request/partner/respond', { requestId, action }),
  getTeachers: () => api.get('/student/teachers'),
};

// Teacher API
export const teacherAPI = {
  getProfile: () => api.get('/teacher/profile'),
  updateProfile: (data) => api.put('/teacher/profile', data),
  getLatestUpdates: (params) => api.get('/teacher/updates/latest', { params }),
  getProjects: (params) => api.get('/teacher/projects', { params }),
  getProjectDetails: (projectId) => api.get(`/teacher/project/${projectId}`),
  commentOnUpdate: (projectId, updateId, comment) => 
    api.put(`/teacher/project/${projectId}/update/${updateId}/comment`, { comment }),
  updateTargets: (projectId, targets) => 
    api.put(`/teacher/project/${projectId}/targets`, { targets }),
  getRequests: () => api.get('/teacher/requests'),
  acceptRequest: (requestId) => api.post(`/teacher/request/${requestId}/accept`),
  rejectRequest: (requestId) => api.post(`/teacher/request/${requestId}/reject`),
};

// Admin API
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getAllProjects: (params) => api.get('/admin/projects', { params }),
  createProject: (data) => api.post('/admin/projects', data),
  assignIncharge: (projectId, teacherId) => 
    api.put(`/admin/project/${projectId}/assign-incharge`, { teacherId }),
  updateProjectStudents: (projectId, studentIds) => 
    api.put(`/admin/project/${projectId}/update-students`, { studentIds }),
  deleteProject: (projectId) => api.delete(`/admin/project/${projectId}`),
  getAllTeachers: (params) => api.get('/admin/teachers', { params }),
  getAllStudents: (params) => api.get('/admin/students', { params }),
};

export default api;
