import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

// Theme and Store
import theme from './theme/theme';
import useAuthStore from './store/authStore';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';

// Student Pages
import StudentProject from './pages/student/ProjectPage';
import StudentProgress from './pages/student/ProgressPage';
import StudentUpdates from './pages/student/UpdatesPage';
import StudentIncharge from './pages/student/InchargePage';
import PartnerPage from './pages/student/PartnerPage';

// Teacher Pages
import TeacherUpdates from './pages/teacher/UpdatesPage';
import TeacherProjects from './pages/teacher/ProjectsPage';
import TeacherRequests from './pages/teacher/RequestsPage';
import TeacherProfile from './pages/teacher/ProfilePage';
import TeacherProjectDetails from './pages/teacher/ProjectDetailsPage';

// Admin Pages
import AdminProjects from './pages/admin/ProjectsPage';
import AdminTeachers from './pages/admin/TeachersPage';
import AdminStudents from './pages/admin/StudentsPage';
import AdminAnalytics from './pages/admin/AnalyticsPage';

// Error Pages
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/login" 
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <AuthPage />
                  )
                } 
              />

              {/* Protected Routes with Layout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* Dashboard Routes */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />

                {/* Student Routes */}
                <Route 
                  path="student/project" 
                  element={
                    <ProtectedRoute requiredRole="student">
                      <StudentProject />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="student/progress" 
                  element={
                    <ProtectedRoute requiredRole="student">
                      <StudentProgress />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="student/updates" 
                  element={
                    <ProtectedRoute requiredRole="student">
                      <StudentUpdates />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="student/incharge" 
                  element={
                    <ProtectedRoute requiredRole="student">
                      <StudentIncharge />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="student/partner" 
                  element={
                    <ProtectedRoute requiredRole="student">
                      <PartnerPage />
                    </ProtectedRoute>
                  } 
                />

                {/* Teacher Routes */}
                <Route 
                  path="teacher/updates" 
                  element={
                    <ProtectedRoute requiredRole="teacher">
                      <TeacherUpdates />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="teacher/projects" 
                  element={
                    <ProtectedRoute requiredRole="teacher">
                      <TeacherProjects />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="teacher/project/:projectId" 
                  element={
                    <ProtectedRoute requiredRole="teacher">
                      <TeacherProjectDetails />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="teacher/requests" 
                  element={
                    <ProtectedRoute requiredRole="teacher">
                      <TeacherRequests />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="teacher/profile" 
                  element={
                    <ProtectedRoute requiredRole="teacher">
                      <TeacherProfile />
                    </ProtectedRoute>
                  } 
                />

                {/* Admin Routes */}
                <Route 
                  path="admin/projects" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminProjects />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="admin/teachers" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminTeachers />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="admin/students" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminStudents />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="admin/analytics" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminAnalytics />
                    </ProtectedRoute>
                  } 
                />
              </Route>

              {/* Error Routes */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </AnimatePresence>
        </Router>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            success: {
              iconTheme: {
                primary: '#4caf50',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#f44336',
                secondary: '#fff',
              },
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
