import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import JobComparisonModal from './components/common/JobComparisonModal';

// Pages
import HomePage from './pages/HomePage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AccountPage from './pages/AccountPage';

// Role-Specific Pages
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import CandidateProfile from './pages/candidate/CandidateProfile';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import PostJobPage from './pages/recruiter/PostJobPage';
import ApplicantsPage from './pages/recruiter/ApplicantsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <div style={{ flex: 1, paddingTop: '74px' }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Authenticated Routes */}
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />

          {/* Candidate Portal Routes */}
          <Route
            path="/candidate/dashboard"
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <CandidateDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/profile"
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <CandidateProfile />
              </ProtectedRoute>
            }
          />

          {/* Recruiter Portal Routes */}
          <Route
            path="/recruiter/dashboard"
            element={
              <ProtectedRoute allowedRoles={['recruiter']}>
                <RecruiterDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/post-job"
            element={
              <ProtectedRoute allowedRoles={['recruiter']}>
                <PostJobPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/applicants"
            element={
              <ProtectedRoute allowedRoles={['recruiter']}>
                <ApplicantsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Portal Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminCategoriesPage />
              </ProtectedRoute>
            }
          />

          {/* Legacy .html redirects for seamless backwards compatibility */}
          <Route path="/pages/jobs.html" element={<Navigate to="/jobs" replace />} />
          <Route path="/pages/job-detail.html" element={<Navigate to="/jobs" replace />} />
          <Route path="/pages/login.html" element={<Navigate to="/login" replace />} />
          <Route path="/pages/register.html" element={<Navigate to="/register" replace />} />
          <Route path="/pages/verify-email.html" element={<Navigate to="/verify-email" replace />} />
          <Route path="/pages/forgot-password.html" element={<Navigate to="/forgot-password" replace />} />
          <Route path="/pages/reset-password.html" element={<Navigate to="/reset-password" replace />} />
          <Route path="/pages/account.html" element={<Navigate to="/account" replace />} />
          <Route path="/pages/candidate/dashboard.html" element={<Navigate to="/candidate/dashboard" replace />} />
          <Route path="/pages/candidate/profile.html" element={<Navigate to="/candidate/profile" replace />} />
          <Route path="/pages/recruiter/dashboard.html" element={<Navigate to="/recruiter/dashboard" replace />} />
          <Route path="/pages/recruiter/post-job.html" element={<Navigate to="/recruiter/post-job" replace />} />
          <Route path="/pages/recruiter/applicants.html" element={<Navigate to="/recruiter/applicants" replace />} />
          <Route path="/pages/admin/dashboard.html" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/pages/admin/users.html" element={<Navigate to="/admin/users" replace />} />
          <Route path="/pages/admin/categories.html" element={<Navigate to="/admin/categories" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Global Side-by-Side Job Comparison Dock & Modal */}
      <JobComparisonModal />

      <Footer />
    </div>
  );
}
