import axios from 'axios';

const getBaseUrl = (): string => {
  const envUrl = ((import.meta as any).env?.VITE_API_URL || '').trim();
  if (!envUrl || envUrl === '/api') return '/api';
  const clean = envUrl.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for JWT and FormData content type handling
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tuition_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('tuition_token');
        localStorage.removeItem('tuition_user');
        window.location.href = '/login?session_expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ======================== API Service Functions ========================

// 1. Auth
export const authApi = {
  login: (credentials: { identifier?: string; email?: string; password: string }) =>
    api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword?: string }) =>
    api.post('/auth/change-password', data),
};



// 3. Students
export const studentApi = {
  getAll: (params?: any) => api.get('/students', { params }),
  getById: (id: string) => api.get(`/students/${id}`),
  getMyProfile: () => api.get('/students/my-profile'),
  create: (formData: FormData) =>
    api.post('/students', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, formData: FormData) =>
    api.put(`/students/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/students/${id}`),
};

// 4. Faculty
export const facultyApi = {
  getAll: (search?: string) => api.get('/faculty', { params: { search } }),
  getById: (id: string) => api.get(`/faculty/${id}`),
  getMyProfile: () => api.get('/faculty/my-profile'),
  create: (formData: FormData) =>
    api.post('/faculty', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, formData: FormData) =>
    api.put(`/faculty/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/faculty/${id}`),
};

// 5. Courses & Programs
export const courseApi = {
  getAll: (status?: string) => api.get('/courses', { params: { status } }),
  getById: (id: string) => api.get(`/courses/${id}`),
  create: (data: any) => api.post('/courses', data),
  update: (id: string, data: any) => api.put(`/courses/${id}`, data),
  delete: (id: string) => api.delete(`/courses/${id}`),
};

// 6. Batches & Timetable
export const batchApi = {
  getAll: (params?: any) => api.get('/batches', { params }),
  getById: (id: string) => api.get(`/batches/${id}`),
  getTimetable: () => api.get('/batches/timetable'),
  create: (data: any) => api.post('/batches', data),
  update: (id: string, data: any) => api.put(`/batches/${id}`, data),
  delete: (id: string) => api.delete(`/batches/${id}`),
};

// 6b. Classrooms & Venues
export const classroomApi = {
  getAll: (status?: string) => api.get('/classrooms', { params: { status } }),
  getById: (id: string) => api.get(`/classrooms/${id}`),
  create: (data: any) => api.post('/classrooms', data),
  update: (id: string, data: any) => api.put(`/classrooms/${id}`, data),
  delete: (id: string) => api.delete(`/classrooms/${id}`),
};

// 7. Attendance
export const attendanceApi = {
  getBatchAttendance: (batchId: string, date?: string, subject?: string) =>
    api.get(`/attendance/batch/${batchId}`, { params: { date, subject } }),
  getAttendanceRange: (batchId: string, startDate: string, endDate: string) =>
    api.get('/attendance/range', { params: { batchId, startDate, endDate } }),
  markAttendance: (data: { batchId: string; date: string; subject?: string; facultyId?: string; records: any[] }) =>
    api.post('/attendance/mark', data),
  getStudentAttendance: (studentId: string, subject?: string) =>
    api.get(`/attendance/student/${studentId}`, { params: { subject } }),
  getMyAttendance: (subject?: string) =>
    api.get('/attendance/my-attendance', { params: { subject } }),
  getInstituteStats: () => api.get('/attendance/institute-stats'),
};

// 8. Student Leaves
export const leaveApi = {
  getAll: (params?: any) => api.get('/leaves', { params }),
  apply: (data: any) => api.post('/leaves/apply', data),
  updateStatus: (id: string, status: string) => api.patch(`/leaves/${id}/status`, { status }),
};

// 11. Study Material & DPPs Repository
export const materialApi = {
  getAll: (params?: any) => api.get('/materials', { params }),
  getById: (id: string) => api.get(`/materials/${id}`),
  create: (formData: FormData) =>
    api.post('/materials', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/materials/${id}`),
  trackDownload: (id: string) => api.post(`/materials/${id}/download`),
};

// 12. Student Doubts Forum
export const doubtApi = {
  getAll: (params?: any) => api.get('/doubts', { params }),
  getById: (id: string) => api.get(`/doubts/${id}`),
  getBatchFaculty: () => api.get('/doubts/batch-faculty'),
  create: (formData: FormData) =>
    api.post('/doubts', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  answer: (id: string, formData: FormData) =>
    api.post(`/doubts/${id}/answer`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/doubts/${id}`),
};



export const assignmentApi = {
  getAll: (params?: any) => api.get('/assignments', { params }),
  getById: (id: string) => api.get(`/assignments/${id}`),
  getMyAssignments: () => api.get('/assignments/my-assignments'),
  create: (formData: FormData) =>
    api.post('/assignments', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, formData: FormData) =>
    api.put(`/assignments/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/assignments/${id}`),
  submit: (id: string, formData: FormData) =>
    api.post(`/assignments/${id}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getSubmissions: (id: string) => api.get(`/assignments/${id}/submissions`),
  gradeSubmission: (submissionId: string, data: { score: number; feedback?: string }) =>
    api.post(`/assignments/submissions/${submissionId}/grade`, data),
};

// 15. Fees & Payments
export const paymentApi = {
  getAll: (params?: any) => api.get('/payments', { params }),
  getById: (id: string) => api.get(`/payments/${id}`),
  getByReceiptId: (receiptId: string) => api.get(`/payments/receipt/${receiptId}`),
  getStudentFeeSummary: (studentId: string) => api.get(`/payments/student/${studentId}`),
  getMyFees: () => api.get('/payments/my-fees'),
  recordPayment: (data: any) => api.post('/payments', data),
  assignFee: (data: {
    targetType: 'ALL' | 'BATCH' | 'STUDENT';
    targetId?: string;
    title: string;
    amount: number;
    dueDate?: string;
    category?: string;
    remarks?: string;
  }) => api.post('/payments/assign-fee', data),
};

// 16. Reports & Analytics
export const reportApi = {
  getDashboardSummary: () => api.get('/reports/dashboard-summary'),
  getRevenueReport: () => api.get('/reports/revenue'),
  getPendingFeesReport: () => api.get('/reports/pending-fees'),
  getBatchStrengthReport: () => api.get('/reports/batch-strength'),
  getCourseRevenueReport: () => api.get('/reports/course-revenue'),
  exportCsvUrl: (type: string) => `/api/reports/export/${type}`,
};

// 17. Notifications
export const notificationApi = {
  getMyNotifications: () => api.get('/notifications'),
  create: (formData: FormData) =>
    api.post('/notifications', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

// 18. Settings
export const settingApi = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data: any) => api.put('/settings', data),
  backupUrl: '/api/settings/backup',
  resetDemoData: () => api.post('/settings/reset-demo'),
};
