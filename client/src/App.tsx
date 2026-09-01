import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';

import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { RoleGuard } from './components/guards/RoleGuard';
import { MainLayout } from './components/layout/MainLayout';

// Auth
import { Login } from './pages/auth/Login';

// Dashboards
import { DashboardRouter } from './pages/dashboard/DashboardRouter';

// Functional Modules
import { StudentList } from './pages/students/StudentList';
import { StudentProfile } from './pages/students/StudentProfile';
import { FacultyList } from './pages/faculty/FacultyList';
import { CourseList } from './pages/courses/CourseList';
import { BatchList } from './pages/batches/BatchList';
import { ClassroomList } from './pages/classrooms/ClassroomList';
import { AttendanceSheet } from './pages/attendance/AttendanceSheet';
import { TimetableView } from './pages/timetable/TimetableView';
import { ExamList } from './pages/exams/ExamList';
import { ResultsEntry } from './pages/results/ResultsEntry';
import { AssignmentList } from './pages/assignments/AssignmentList';
import { FeeDashboard } from './pages/fees/FeeDashboard';
import { ReportsPage } from './pages/reports/ReportsPage';
import { NotificationCenter } from './pages/notifications/NotificationCenter';
import { SettingsPage } from './pages/settings/SettingsPage';

// Real-World Coaching Modules
import { MaterialList } from './pages/materials/MaterialList';
import { DoubtForum } from './pages/doubts/DoubtForum';
import { LeaveManagement } from './pages/leaves/LeaveManagement';

// Student Portal Modules
import { MyBatch } from './pages/student-portal/MyBatch';
import { MyAttendance } from './pages/student-portal/MyAttendance';
import { MyFees } from './pages/student-portal/MyFees';
import { MyExams } from './pages/student-portal/MyExams';
import { MyAssignments } from './pages/student-portal/MyAssignments';
import { MyProfile } from './pages/student-portal/MyProfile';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <SettingsProvider>
            <BrowserRouter>
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
                    path="/classrooms"
                    element={
                      <RoleGuard allowedRoles={['ADMINISTRATOR']}>
                        <ClassroomList />
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

                  {/* Study Materials & DPPs */}
                  <Route
                    path="/materials"
                    element={
                      <RoleGuard allowedRoles={['TEACHER', 'STUDENT']}>
                        <MaterialList />
                      </RoleGuard>
                    }
                  />

                  {/* 1-on-1 Doubt Forum */}
                  <Route
                    path="/doubts"
                    element={
                      <RoleGuard allowedRoles={['TEACHER', 'STUDENT']}>
                        <DoubtForum />
                      </RoleGuard>
                    }
                  />

                  {/* Attendance Management (Admin Rollcall) */}
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

                  {/* Timetable / Schedule */}
                  <Route
                    path="/timetable"
                    element={
                      <RoleGuard allowedRoles={['ADMINISTRATOR', 'TEACHER', 'STUDENT']}>
                        <TimetableView />
                      </RoleGuard>
                    }
                  />

                  {/* Examination Management */}
                  <Route
                    path="/exams"
                    element={
                      <RoleGuard allowedRoles={['ADMINISTRATOR', 'TEACHER']}>
                        <ExamList />
                      </RoleGuard>
                    }
                  />

                  {/* Results & Grading */}
                  <Route
                    path="/results"
                    element={
                      <RoleGuard allowedRoles={['ADMINISTRATOR', 'TEACHER']}>
                        <ResultsEntry />
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

                  {/* Reports & Financial Analytics (Accountant Financial Core) */}
                  <Route
                    path="/reports"
                    element={
                      <RoleGuard allowedRoles={['ADMINISTRATOR', 'ACCOUNTANT']}>
                        <ReportsPage />
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
                    path="/student/exams"
                    element={
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <MyExams />
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
                    path="/student/results"
                    element={
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <Navigate to="/student/exams" replace />
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
                </Route>

                {/* 404 Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </SettingsProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
