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
import AdminUsersPage from './pages/admin/UsersPage';
import UploadCVPage from './pages/interviewee/UploadCVPage';
import InterviewerJobsPage from './pages/interviewer/JobsPage';
import CreateJobPage from './pages/interviewer/CreateJobPage';
import JobDetailPage from './pages/interviewer/JobDetailPage';
import JobsPage from './pages/interviewee/JobsPage';
import JobApplicationPage from './pages/interviewee/JobApplicationPage';
import IntervieweeApplicationsPage from './pages/interviewee/ApplicationsPage';
import InterviewerApplicationsPage from './pages/interviewer/ApplicationsPage';
import ApplicationDetailPage from './pages/interviewee/ApplicationDetailPage';
import ActiveInterviewPage from './pages/interviewee/ActiveInterviewPage';
import InterviewSetupPage from './pages/interviewee/InterviewSetupPage';
import HistoryPage from './pages/interviewee/HistoryPage';
import AnalyticsPage from './pages/interviewee/AnalyticsPage';
import UpcomingInterviewsPage from './pages/interviewee/UpcomingInterviewsPage';
import FeedbackPage from './pages/interviewee/FeedbackPage';
import ScheduleInterviewPage from './pages/interviewer/ScheduleInterviewPage';
import ApplicationStatusPage from './pages/interviewer/ApplicationStatusPage';
import ScheduledInterviewsPage from './pages/interviewer/ScheduledInterviewsPage';
import ScheduledInterviewDetailPage from './pages/interviewer/ScheduledInterviewDetailPage';
import InterviewLayout from './layouts/InterviewLayout';
import AdminInterviewsPage from './pages/admin/InterviewsPage';
import AdminJobsPage from './pages/admin/JobsPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import AdminInterviewDetailPage from './pages/admin/AdminInterviewDetailPage';
import AdminJobDetailPage from './pages/admin/AdminJobDetailPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminActivitiesPage from './pages/admin/AdminActivitiesPage';
import NotificationsPage from './pages/NotificationsPage';

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
              <Route path="upload-cv" element={<UploadCVPage />} />
              <Route path="jobs" element={<JobsPage />} />
              <Route path="jobs/:jobId/apply" element={<JobApplicationPage />} />
              <Route path="/interviewee/applications" element={<IntervieweeApplicationsPage />} />
              <Route path="/interviewee/applications/:id" element={<ApplicationDetailPage />} />
              <Route path="settings" element={<ProfileSettingsPage />} />
              <Route path="interview/setup" element={<InterviewSetupPage />} />
              {/* <Route path="interview/active/:sessionId" element={<ActiveInterviewPage />} /> */}

              {/* <Route path="interview/active/:sessionId" element={<InterviewLayout />}>
                <Route index element={<ActiveInterviewPage />} />
              </Route> */}
              <Route path="interview/feedback/:sessionId" element={<FeedbackPage />} /> 
               <Route path="history" element={<HistoryPage />} /> 
               <Route path="analytics" element={<AnalyticsPage />} /> 
               <Route path="upcoming" element={<UpcomingInterviewsPage />} />
               <Route path="notifications" element={<NotificationsPage />} />
            </Route>
          </Route>

          <Route path="/interviewee/interview/active/:sessionId" element={<InterviewLayout />}>
            <Route index element={<ActiveInterviewPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['interviewer']} />}>
            <Route path="/interviewer" element={<DashboardLayout />}>
              <Route index element={<InterviewerDashboard />} />
              <Route path="jobs" element={<InterviewerJobsPage />} />
              <Route path="jobs/create" element={<CreateJobPage />} />
              <Route path="jobs/:jobId" element={<JobDetailPage />} />  
              <Route path="schedule" element={<ScheduleInterviewPage />} />
              <Route path="/interviewer/applications" element={<InterviewerApplicationsPage />} />
              <Route path="applications/:applicationId/status" element={<ApplicationStatusPage />} />
              <Route path="scheduled" element={<ScheduledInterviewsPage />} />
              <Route path="scheduled/:scheduledId" element={<ScheduledInterviewDetailPage />} />
              <Route path="settings" element={<ProfileSettingsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<DashboardLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="settings" element={<ProfileSettingsPage />} />
              <Route path="interviews" element={<AdminInterviewsPage />} />
              <Route path="jobs" element={<AdminJobsPage />} />
              <Route path="users/:userId" element={<AdminUserDetailPage />} />
              <Route path="interviews/:interviewId" element={<AdminInterviewDetailPage />} />
              <Route path="jobs/:jobId" element={<AdminJobDetailPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="activities" element={<AdminActivitiesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;