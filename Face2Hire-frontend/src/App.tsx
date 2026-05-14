import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import ProtectedRoute from './components/ProtectedRoute';
import RootLayout from './layouts/RootLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import IntervieweeDashboard from './pages/interviewee/Dashboard';
import InterviewerDashboard from './pages/interviewer/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import OAuth2RedirectPage from './pages/OAuth2RedirectPage';
import type { JSX } from 'react';

function App(): JSX.Element {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/oauth2/redirect" element={<OAuth2RedirectPage />} />

          <Route element={<RootLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['interviewee']} />}>
            <Route path="/interviewee" element={<DashboardLayout />}>
              <Route index element={<IntervieweeDashboard />} />
              <Route path="settings" element={<ProfileSettingsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['interviewer']} />}>
            <Route path="/interviewer" element={<DashboardLayout />}>
              <Route index element={<InterviewerDashboard />} />
              <Route path="settings" element={<ProfileSettingsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<DashboardLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="settings" element={<ProfileSettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;