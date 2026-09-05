import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';

import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { RoleGuard } from './components/guards/RoleGuard';
import { MainLayout } from './components/layout/MainLayout';
import { LoadingSkeleton } from './components/common/LoadingSkeleton';

// Auth
const Login = lazy(() => import('./pages/auth/Login').then((m) => ({ default: m.Login })));

// Dashboards
const DashboardRouter = lazy(() => import('./pages/dashboard/DashboardRouter').then((m) => ({ default: m.DashboardRouter })));

// Functional Modules
const StudentList = lazy(() => import('./pages/students/StudentList').then((m) => ({ default: m.StudentList })));
const StudentProfile = lazy(() => import('./pages/students/StudentProfile').then((m) => ({ default: m.StudentProfile })));
const FacultyList = lazy(() => import('./pages/faculty/FacultyList').then((m) => ({ default: m.FacultyList })));
const CourseList = lazy(() => import('./pages/courses/CourseList').then((m) => ({ default: m.CourseList })));
const BatchList = lazy(() => import('./pages/batches/BatchList').then((m) => ({ default: m.BatchList })));
const AttendanceSheet = lazy(() => import('./pages/attendance/AttendanceSheet').then((m) => ({ default: m.AttendanceSheet })));
const AssignmentList = lazy(() => import('./pages/assignments/AssignmentList').then((m) => ({ default: m.AssignmentList })));
const FeeDashboard = lazy(() => import('./pages/fees/FeeDashboard').then((m) => ({ default: m.FeeDashboard })));
const ReceiptsAuditPage = lazy(() => import('./pages/fees/ReceiptsAuditPage').then((m) => ({ default: m.ReceiptsAuditPage })));
const NotificationCenter = lazy(() => import('./pages/notifications/NotificationCenter').then((m) => ({ default: m.NotificationCenter })));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));

// Real-World Coaching Modules
const MaterialList = lazy(() => import('./pages/materials/MaterialList').then((m) => ({ default: m.MaterialList })));
const DoubtForum = lazy(() => import('./pages/doubts/DoubtForum').then((m) => ({ default: m.DoubtForum })));
const LeaveManagement = lazy(() => import('./pages/leaves/LeaveManagement').then((m) => ({ default: m.LeaveManagement })));

// Student Portal Modules
const MyBatch = lazy(() => import('./pages/student-portal/MyBatch').then((m) => ({ default: m.MyBatch })));
const MyAttendance = lazy(() => import('./pages/student-portal/MyAttendance').then((m) => ({ default: m.MyAttendance })));
const MyFees = lazy(() => import('./pages/student-portal/MyFees').then((m) => ({ default: m.MyFees })));
const MyAssignments = lazy(() => import('./pages/student-portal/MyAssignments').then((m) => ({ default: m.MyAssignments })));
const MyProfile = lazy(() => import('./pages/student-portal/MyProfile').then((m) => ({ default: m.MyProfile })));
const FacultyProfile = lazy(() => import('./pages/faculty/FacultyProfile').then((m) => ({ default: m.FacultyProfile })));

const PageFallback = () => (
  <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
    <div className="h-8 bg-slate-200 rounded-xl w-64"></div>
    <LoadingSkeleton count={5} />
  </div>
);

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <RealtimeProvider>
            <SettingsProvider>
              <BrowserRouter>
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    {/* Public Auth Route */}
                    <Route path="/login" element={<Login />} />

                    {/* Authenticated Application Layout */}
                    <Route
                      element={
                        <ProtectedRoute>
                          <MainLayout />
                        </ProtectedRoute>
                      }
                    >
                      {/* Dynamic Dashboard based on User Role */}
                      <Route path="/" element={<DashboardRouter />} />
                      <Route path="/dashboard" element={<DashboardRouter />} />

                  {/* Student Management */}
                  <Route
                    path="/students"
                    element={
                      <RoleGuard allowedRoles={['ADMINISTRATOR', 'ACCOUNTANT', 'TEACHER']}>
                        <StudentList />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/students/:id"
                    element={
                      <RoleGuard allowedRoles={['ADMINISTRATOR', 'ACCOUNTANT', 'TEACHER']}>
                        <StudentProfile />
                      </RoleGuard>
                    }
                  />

                  {/* Faculty Management */}
                  <Route
                    path="/faculty"
                    element={
                      <RoleGuard allowedRoles={['ADMINISTRATOR']}>
                        <FacultyList />
                      </RoleGuard>
                    }
                  />

                  {/* Course Management */}
                  <Route
                    path="/courses"
                    element={
                      <RoleGuard allowedRoles={['ADMINISTRATOR']}>
                        <CourseList />
                      </RoleGuard>
                    }
                  />

                  {/* Batch Management */}
                  <Route
                    path="/batches"
                    element={
                      <RoleGuard allowedRoles={['ADMINISTRATOR']}>
                        <BatchList />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/teacher/batches"
                    element={
                      <RoleGuard allowedRoles={['TEACHER']}>
                        <BatchList />
                      </RoleGuard>
                    }
                  />

                  {/* Study Materials */}
                  <Route
                    path="/materials"
                    element={
                      <RoleGuard allowedRoles={['TEACHER', 'STUDENT']}>
                        <MaterialList />
                      </RoleGuard>
                    }
                  />

                  {/* Doubt Forum */}
                  <Route
                    path="/doubts"
                    element={
                      <RoleGuard allowedRoles={['TEACHER', 'STUDENT']}>
                        <DoubtForum />
                      </RoleGuard>
                    }
                  />

                  {/* Attendance Management (Admin Attendance) */}
                  <Route
                    path="/attendance"
                    element={
                      <RoleGuard allowedRoles={['ADMINISTRATOR', 'TEACHER']}>
                        <AttendanceSheet />
                      </RoleGuard>
                    }
                  />

                  {/* Student Leaves */}
                  <Route
                    path="/leaves"
                    element={
                      <RoleGuard allowedRoles={['ADMINISTRATOR', 'TEACHER', 'STUDENT']}>
                        <LeaveManagement />
                      </RoleGuard>
                    }
                  />

                  {/* Assignment Management */}
                  <Route
                    path="/assignments"
                    element={
                      <RoleGuard allowedRoles={['ADMINISTRATOR', 'TEACHER']}>
                        <AssignmentList />
                      </RoleGuard>
                    }
                  />

                  {/* Fees & Collections (Accountant Financial Core) */}
                  <Route
                    path="/fees"
                    element={
                      <RoleGuard allowedRoles={['ADMINISTRATOR', 'ACCOUNTANT']}>
                        <FeeDashboard />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/receipts"
                    element={
                      <RoleGuard allowedRoles={['ADMINISTRATOR', 'ACCOUNTANT']}>
                        <ReceiptsAuditPage />
                      </RoleGuard>
                    }
                  />

                  {/* Notifications Center */}
                  <Route
                    path="/notifications"
                    element={
                      <RoleGuard allowedRoles={['ADMINISTRATOR', 'ACCOUNTANT', 'TEACHER', 'STUDENT']}>
                        <NotificationCenter />
                      </RoleGuard>
                    }
                  />

                  {/* Settings */}
                  <Route
                    path="/settings"
                    element={
                      <RoleGuard allowedRoles={['ADMINISTRATOR']}>
                        <SettingsPage />
                      </RoleGuard>
                    }
                  />

                  {/* Student Portal Dedicated Routes */}
                  <Route
                    path="/student/my-batch"
                    element={
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <MyBatch />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/student/attendance"
                    element={
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <MyAttendance />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/student/fees"
                    element={
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <MyFees />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/student/assignments"
                    element={
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <MyAssignments />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/student/profile"
                    element={
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <MyProfile />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/faculty/profile"
                    element={
                      <RoleGuard allowedRoles={['TEACHER']}>
                        <FacultyProfile />
                      </RoleGuard>
                    }
                  />
                </Route>

                {/* 404 Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </SettingsProvider>
      </RealtimeProvider>
    </AuthProvider>
  </ToastProvider>
</ThemeProvider>
  );
};

export default App;

