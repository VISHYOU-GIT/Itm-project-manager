import axios from 'axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      toast.error('Session expired. Please login again.');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error('Access denied. Insufficient permissions.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.response?.data?.error) {
      toast.error(error.response.data.error);
    } else {
      toast.error('An unexpected error occurred.');
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  loginStudent: (data) => api.post('/auth/student/login', data),
  registerStudent: (data) => api.post('/auth/student/register', data),
  loginTeacher: (data) => api.post('/auth/teacher/login', data),
  registerTeacher: (data) => api.post('/auth/teacher/register', data),
  loginAdmin: (data) => api.post('/auth/admin/login', data),
};

// Student API calls
export const studentAPI = {
  getProfile: () => api.get('/student/profile'),
  updateProject: (data) => api.put('/student/project/update', data),
  editUpdate: (updateId, data) => api.put(`/student/project/update/${updateId}`, data),
  getProgress: () => api.get('/student/project/progress'),
  getDailyUpdates: () => api.get('/student/daily-updates'),
  requestIncharge: (data) => api.post('/student/request/incharge', data),
  requestPartner: (data) => api.post('/student/request/partner', data),
  getTeachers: () => api.get('/student/teachers'),
  respondToPartnerRequest: (data) => api.post('/student/request/partner/respond', data),
  
  // Additional endpoints for complete integration
  getPartnerRequests: () => api.get('/student/partner-requests'),
  getAvailableStudents: (search = '') => api.get('/student/available-students', { params: { search } }),
  sendPartnerRequest: (data) => api.post('/student/send-partner-request', data),
  respondPartnerRequest: (data) => api.post('/student/respond-partner-request', data),
};

// Teacher API calls
export const teacherAPI = {
  getProfile: () => api.get('/teacher/profile'),
  updateProfile: (data) => api.put('/teacher/profile', data),
  getLatestUpdates: (params) => api.get('/teacher/updates/latest', { params }),
  getProjects: (params) => api.get('/teacher/projects', { params }),
  getProjectDetails: (projectId) => api.get(`/teacher/project/${projectId}`),
  commentOnUpdate: (projectId, updateId, data) => 
    api.put(`/teacher/project/${projectId}/update/${updateId}/comment`, data),
  updateTargets: (projectId, data) => api.put(`/teacher/project/${projectId}/targets`, data),
  getRequests: () => api.get('/teacher/requests'),
  acceptRequest: (requestId) => api.post(`/teacher/request/${requestId}/accept`),
  rejectRequest: (requestId) => api.post(`/teacher/request/${requestId}/reject`),
  
  // Additional endpoints for complete integration
  createProject: (data) => api.post('/teacher/projects', data),
  updateProject: (projectId, data) => api.put(`/teacher/projects/${projectId}`, data),
  getProjectUpdates: (projectId) => api.get(`/teacher/project/${projectId}/updates`),
  getStudentUpdates: () => api.get('/teacher/student-updates'),
  addUpdateComment: (data) => api.post('/teacher/update-comment', data),
  getStats: () => api.get('/teacher/stats'),
  getInchargeRequests: () => api.get('/teacher/incharge-requests'),
  respondToInchargeRequest: (data) => api.post('/teacher/respond-incharge-request', data),
  getAssignedProjects: () => api.get('/teacher/projects'),
  
  // Project progress and target management
  updateProjectProgress: (projectId, data) => api.put(`/teacher/projects/${projectId}`, { progress: data.progress }),
  
  // This endpoint should match the backend expectation - targets must be an array
  updateProjectTargets: (projectId, data) => api.put(`/teacher/project/${projectId}/targets`, {
    targets: Array.isArray(data) ? data : [data]
  }),
};

// Admin API calls
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getAllProjects: (params) => api.get('/admin/projects', { params }),
  createProject: (data) => api.post('/admin/projects', data),
  assignIncharge: (projectId, data) => api.put(`/admin/project/${projectId}/assign-incharge`, data),
  updateProjectStudents: (projectId, data) => api.put(`/admin/project/${projectId}/update-students`, data),
  deleteProject: (projectId) => api.delete(`/admin/project/${projectId}`),
  getAllTeachers: (params) => api.get('/admin/teachers', { params }),
  getAllStudents: (params) => api.get('/admin/students', { params }),
};

export default api;
