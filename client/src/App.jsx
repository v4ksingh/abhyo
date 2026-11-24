import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import useAuthStore from './store/authStore';
import AIChatbot from './components/shared/AIChatbot';
import useIdleTimer from './hooks/useIdleTimer';
import IdleWarningModal from './components/shared/IdleWarningModal';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';
import PublicLayout from './components/layout/PublicLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OTPLoginPage from './pages/auth/OTPLoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import WelcomePage from './pages/auth/WelcomePage';

// Public
import LandingPage from './pages/Landing';
import AvailableTests from './pages/AvailableTests';
import InstitutesListPage from './pages/InstitutesListPage';
import InstituteLandingPage from './pages/InstituteLandingPage';
import PublicCoursePage from './pages/PublicCoursePage';
import Courses from './pages/Courses';
import CategoriesPage from './pages/CategoriesPage';
import UpcomingExams from './pages/UpcomingExams';
import ExamDetail from './pages/ExamDetail';
import EBookStore from './pages/EBookStore';
import EBookDetail from './pages/EBookDetail';
import EBookCheckout from './pages/EBookCheckout';


// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import MyTests from './pages/student/MyTests';
import TestInterface from './pages/student/TestInterface';
import TestLobby from './pages/student/TestLobby';
import TestResult from './pages/student/TestResult';
import StudentResults from './pages/student/Results';
import Leaderboard from './pages/student/Leaderboard';
import StudentSubscription from './pages/student/Subscription';
import MyCourses from './pages/student/MyCourses';
import MyEBooks from './pages/student/MyEBooks';
import CoursePlayer from './pages/student/CoursePlayer';
import StudentIdCard from './pages/student/StudentIdCard';
import StudentCertificates from './pages/student/StudentCertificates';


// Institute Pages
import InstituteDashboard from './pages/institute/Dashboard';
import StudentsPage from './pages/institute/Students';
import BatchesPage from './pages/institute/Batches';
import InstituteTests from './pages/institute/Tests';
import InstituteProfile from './pages/institute/Profile';
import InstituteSubscription from './pages/institute/Subscription';
import InstituteAnnouncements from './pages/institute/Announcements';
import InstituteAccounts from './pages/institute/Accounts';
import InstituteCourses from './pages/institute/Courses';
import InstituteCourseDetails from './pages/institute/CourseDetails';
import AttendancePage from './pages/institute/Attendance';
import LiveClasses from './pages/institute/LiveClasses';
import ReviewsManagement from './pages/institute/ReviewsManagement';
import InstituteAnalytics from './pages/institute/Analytics';
import InstituteCertificates from './pages/institute/InstituteCertificates';

// HR Pages
import Departments from './pages/institute/hr/Departments';
import Designations from './pages/institute/hr/Designations';
import LeaveTypes from './pages/institute/hr/LeaveTypes';
import StaffDirectory from './pages/institute/hr/StaffDirectory';
import LeaveRequests from './pages/institute/hr/LeaveRequests';
import StaffAttendance from './pages/institute/hr/StaffAttendance';
import Payroll from './pages/institute/hr/Payroll';
import TeacherRatings from './pages/institute/hr/TeacherRatings';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminCategories from './pages/admin/Categories';
import AdminTests from './pages/admin/Tests';
import QuestionBank from './pages/admin/QuestionBank';
import AdminInstitutes from './pages/admin/Institutes';
import AdminUsers from './pages/admin/Users';
import AdminRevenue from './pages/admin/Revenue';
import AdminResults from './pages/admin/Results';
import AdminAnalytics from './pages/admin/Analytics';
import AdminSettings from './pages/admin/Settings';
import ExamSeriesAdmin from './pages/admin/ExamSeriesAdmin';
import VideoSeriesAdmin from './pages/admin/VideoSeriesAdmin';
import ExamSeriesForm from './pages/admin/ExamSeriesForm';
import AdminPlans from './pages/admin/Plans';
import AdminSeriesNotes from './pages/admin/SeriesNotes';
import CMS from './pages/admin/CMS';
import AdminStaff from './pages/admin/Staff';
import EmailBroadcast from './pages/admin/EmailBroadcast';
import Waitlist from './pages/admin/Waitlist';
import EBooksAdmin from './pages/admin/EBooksAdmin';
import AdminProfile from './pages/admin/Profile';
import GovernmentJobsAdmin from './pages/admin/government-jobs/GovernmentJobsAdmin';

// Government Jobs (public)
import GovernmentJobsListPage from './pages/jobs/GovernmentJobsListPage';
import GovernmentJobDetailPage from './pages/jobs/GovernmentJobDetailPage';

// Exam Series (public)
import ExamSeriesPage from './pages/exam/ExamSeriesPage';
import ExamSeriesList from './pages/exam/ExamSeriesList';

// Video Series (public)
import VideoSeriesList from './pages/video/VideoSeriesList';
import VideoSeriesPage from './pages/video/VideoSeriesPage';

// Shared
import ProfilePage from './pages/shared/Profile';
import NotificationsPage from './pages/shared/Notifications';
import PlansPage from './pages/shared/Plans';
import AboutUs from './pages/shared/AboutUs';
import Blog from './pages/shared/Blog';
import BlogPost from './pages/shared/BlogPost';
import Contact from './pages/shared/Contact';
import PrivacyPolicy from './pages/shared/PrivacyPolicy';
import Terms from './pages/shared/Terms';
import RefundPolicy from './pages/shared/RefundPolicy';
import Checkout from './pages/shared/Checkout';
import CertificateView from './pages/shared/CertificateView';

// Olympiad — Public
import OlympiadHome   from './pages/olympiad/OlympiadHome';
import OlympiadAwards from './pages/olympiad/OlympiadAwards';
import OlympiadVerify from './pages/olympiad/OlympiadVerify';
import OlympiadAccountRegister from './pages/olympiad/OlympiadAccountRegister';
import OlympiadDetail from './pages/olympiad/OlympiadDetail';

// Olympiad — Student
import OlympiadDashboard        from './pages/student/olympiad/OlympiadDashboard';
import OlympiadRegister         from './pages/student/olympiad/OlympiadRegister';
import AdmitCard                from './pages/student/olympiad/AdmitCard';
import OlympiadExam             from './pages/student/olympiad/OlympiadExam';
import OlympiadResult           from './pages/student/olympiad/OlympiadResult';
import OlympiadCertificate      from './pages/student/olympiad/OlympiadCertificate';
import OlympiadStudyMaterials   from './pages/student/olympiad/OlympiadStudyMaterials';
import OlympiadPreparation      from './pages/student/olympiad/OlympiadPreparation';
import OlympiadMockExam         from './pages/student/olympiad/OlympiadMockExam';
import OlympiadReceipt          from './pages/student/olympiad/OlympiadReceipt';

// Olympiad — Admin
import OlympiadAdminDashboard        from './pages/admin/olympiad/OlympiadAdminDashboard';
import OlympiadList                  from './pages/admin/olympiad/OlympiadList';
import OlympiadForm                  from './pages/admin/olympiad/OlympiadForm';
import OlympiadQuestions             from './pages/admin/olympiad/OlympiadQuestions';
import OlympiadRegistrations         from './pages/admin/olympiad/OlympiadRegistrations';
import OlympiadResults               from './pages/admin/olympiad/OlympiadResults';
import AdminOlympiadStudyMaterials   from './pages/admin/olympiad/AdminOlympiadStudyMaterials';
import OlympiadRewardsManager        from './pages/admin/olympiad/OlympiadRewardsManager';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user) return <div className="h-screen w-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated) {
    if (!user) return <div className="h-screen w-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
    const redirectMap = {
      superadmin: '/admin/dashboard',
      admin: '/admin/dashboard',
      accountant: '/admin/revenue',
      content_manager: '/admin/questions',
      teacher: '/admin/questions',
      institute: '/institute/dashboard',
      student: user.isOlympiadUser ? '/student/olympiad' : '/student/dashboard',
      instructor: '/instructor/courses',
    };
    return <Navigate to={redirectMap[user.role] || '/student/dashboard'} replace />;
  }
  return children;
};

const RoleRedirect = () => {
  const { user } = useAuthStore();
  if (!user) return <div className="h-screen w-full flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  const redirectMap = {
    superadmin: '/admin/dashboard',
    admin: '/admin/dashboard',
    accountant: '/admin/revenue',
    content_manager: '/admin/questions',
    teacher: '/admin/questions',
    institute: '/institute/dashboard',
    student: user.isOlympiadUser ? '/student/olympiad' : '/student/dashboard',
    instructor: '/instructor/courses',
  };
  return <Navigate to={redirectMap[user.role] || '/student/dashboard'} />;
};

function App() {
  const { isAuthenticated, fetchMe, logout } = useAuthStore();
  const [showIdleWarning, setShowIdleWarning] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetchMe();
  }, []);

  const handleWarning = useCallback(() => {
    setShowIdleWarning(true);
  }, []);

  const handleIdle = useCallback(() => {
    setShowIdleWarning(false);
    logout();
    toast.error('You were logged out due to 10 minutes of inactivity.', { duration: 5000 });
  }, [logout]);

  const { resetTimer } = useIdleTimer({
    idleMs: 10 * 60 * 1000,   // 10 minutes
    warningMs: 60 * 1000,     // warn 1 min before
    onWarning: handleWarning,
    onIdle: handleIdle,
    enabled: isAuthenticated,
  });

  const handleStayLoggedIn = useCallback(() => {
    setShowIdleWarning(false);
    resetTimer();
  }, [resetTimer]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' },
          success: { iconTheme: { primary: '#10b981', secondary: '#f9fafb' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#f9fafb' } },
        }}
      />
      <IdleWarningModal
        visible={showIdleWarning}
        onStay={handleStayLoggedIn}
        onLogout={handleIdle}
      />
      <GlobalChatbot />
      <Routes>
        {/* Public Informational */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/tests" element={<AvailableTests />} />
          <Route path="/institutes" element={<InstitutesListPage />} />
          <Route path="/i/:slug" element={<InstituteLandingPage />} />
          <Route path="/c/:slug" element={<PublicCoursePage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/exam-series" element={<ExamSeriesList />} />
          <Route path="/exam-series/:slug" element={<ExamSeriesPage />} />
          <Route path="/video-series" element={<VideoSeriesList />} />
          <Route path="/video-series/:slug" element={<VideoSeriesPage />} />
          <Route path="/live-test" element={<Courses />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/refund" element={<RefundPolicy />} />
          <Route path="/upcoming-exams" element={<UpcomingExams />} />
          <Route path="/upcoming-exams/:slug" element={<ExamDetail />} />
          <Route path="/government-jobs" element={<GovernmentJobsListPage />} />
          <Route path="/government-jobs/:slug" element={<GovernmentJobDetailPage />} />
          <Route path="/ebooks" element={<EBookStore />} />
          <Route path="/ebooks/:slug" element={<EBookDetail />} />
          <Route path="/ebook-checkout/:id" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<EBookCheckout />} />
          </Route>

          <Route path="/olympiad" element={<OlympiadHome />} />
          <Route path="/olympiad/awards" element={<OlympiadAwards />} />
          <Route path="/olympiad/awards-scholarships" element={<OlympiadAwards />} />
          <Route path="/olympiad/:id" element={<OlympiadDetail />} />
        </Route>

        {/* Full-screen Public Views */}
        <Route path="/certificate/:id" element={<CertificateView />} />
        <Route path="/olympiad/verify/:certId" element={<OlympiadVerify />} />
        <Route path="/olympiad/register-account" element={<OlympiadAccountRegister />} />

        {/* Auth Public */}
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/admin/login" element={<PublicRoute><AdminLoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/otp-login" element={<PublicRoute><OTPLoginPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Auth redirect */}
        <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
        
        {/* Checkout - Shared Authenticated Route */}
        <Route path="/checkout" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Checkout />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={<ProtectedRoute roles={['student']}><DashboardLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="tests" element={<MyTests />} />
          <Route path="results" element={<StudentResults />} />
          <Route path="results/:resultId" element={<TestResult />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="subscription" element={<StudentSubscription />} />
          <Route path="courses" element={<MyCourses />} />
          <Route path="ebooks" element={<MyEBooks />} />

          <Route path="attendance" element={<AttendancePage />} />
          <Route path="live-classes" element={<LiveClasses />} />
          <Route path="id-card" element={<StudentIdCard />} />
          <Route path="certificates" element={<StudentCertificates />} />
          {/* Olympiad Student Routes */}
          <Route path="olympiad" element={<OlympiadDashboard />} />
          <Route path="olympiad/study-materials" element={<OlympiadStudyMaterials />} />
          <Route path="olympiad/register/:olympiadId" element={<OlympiadRegister />} />
          <Route path="olympiad/preparation/:regId" element={<OlympiadPreparation />} />
          <Route path="olympiad/admit-card/:regId" element={<AdmitCard />} />
          <Route path="olympiad/receipt/:regId" element={<OlympiadReceipt />} />
          <Route path="olympiad/result/:olympiadId" element={<OlympiadResult />} />
          <Route path="olympiad/certificate/:certId" element={<OlympiadCertificate />} />
        </Route>

        <Route path="/student/courses/:id" element={<ProtectedRoute roles={['student']}><CoursePlayer /></ProtectedRoute>} />

        {/* Olympiad Exam & Mock Test — Full-screen, no sidebar */}
        <Route path="/student/olympiad/exam/:olympiadId" element={<ProtectedRoute roles={['student']}><OlympiadExam /></ProtectedRoute>} />
        <Route path="/student/olympiad/mock-exam/:regId" element={<ProtectedRoute roles={['student']}><OlympiadMockExam /></ProtectedRoute>} />
        <Route path="/student/olympiad/mock-exam" element={<ProtectedRoute roles={['student']}><OlympiadMockExam /></ProtectedRoute>} />

        {/* Test Lobby (pre-test) + Test Interface (full-screen, no sidebar) */}
        <Route path="/test/:testId/lobby" element={<ProtectedRoute roles={['student', 'superadmin']}><TestLobby /></ProtectedRoute>} />
        <Route path="/test/:testId" element={<ProtectedRoute roles={['student']}><TestInterface /></ProtectedRoute>} />

        {/* Institute Routes */}
        <Route path="/institute" element={<ProtectedRoute roles={['institute']}><DashboardLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<InstituteDashboard />} />
          <Route path="analytics" element={<InstituteAnalytics />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="batches" element={<BatchesPage />} />
          <Route path="tests" element={<InstituteTests />} />
          <Route path="results/:resultId" element={<TestResult />} />
          <Route path="accounts" element={<InstituteAccounts />} />
          <Route path="profile" element={<InstituteProfile />} />
          <Route path="subscription" element={<InstituteSubscription />} />
          <Route path="announcements" element={<InstituteAnnouncements />} />
          <Route path="courses" element={<InstituteCourses />} />
          <Route path="courses/:id" element={<InstituteCourseDetails />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="live-classes" element={<LiveClasses />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="reviews" element={<ReviewsManagement />} />
          <Route path="certificates" element={<InstituteCertificates />} />
          <Route path="students/:studentId/id-card" element={<StudentIdCard />} />
          
          {/* HR Routes */}
          <Route path="hr/departments" element={<Departments />} />
          <Route path="hr/designations" element={<Designations />} />
          <Route path="hr/leave-types" element={<LeaveTypes />} />
          <Route path="hr/staff" element={<StaffDirectory />} />
          <Route path="hr/disabled-staff" element={<StaffDirectory disabled={true} />} />
          <Route path="hr/leave-requests" element={<LeaveRequests />} />
          <Route path="hr/apply-leave" element={<LeaveRequests forceApply={true} />} />
          <Route path="hr/attendance" element={<StaffAttendance />} />
          <Route path="hr/payroll" element={<Payroll />} />
          <Route path="hr/ratings" element={<TeacherRatings />} />
        </Route>

        {/* Instructor Routes */}
        <Route path="/instructor" element={<ProtectedRoute roles={['instructor']}><DashboardLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<Navigate to="/instructor/courses" replace />} />
          <Route path="courses" element={<InstituteCourses />} />
          <Route path="courses/:id" element={<InstituteCourseDetails />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Admin Routes — accessible by all staff roles */}
        <Route path="/admin" element={<ProtectedRoute roles={['superadmin', 'admin', 'accountant', 'content_manager', 'teacher']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="tests" element={<AdminTests />} />
          <Route path="questions" element={<QuestionBank />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="institutes" element={<AdminInstitutes />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="revenue" element={<AdminRevenue />} />
          <Route path="results" element={<AdminResults />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="exam-series" element={<ExamSeriesAdmin />} />
          <Route path="video-series" element={<VideoSeriesAdmin />} />
          <Route path="exam-series/form" element={<ExamSeriesForm />} />
          <Route path="exam-series/:seriesId/notes" element={<AdminSeriesNotes />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="cms" element={<CMS />} />
          <Route path="staff" element={<AdminStaff />} />
          <Route path="emails" element={<EmailBroadcast />} />
          <Route path="waitlist" element={<Waitlist />} />
          <Route path="ebooks" element={<EBooksAdmin />} />
          <Route path="government-jobs" element={<GovernmentJobsAdmin />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="notifications" element={<NotificationsPage />} />
          {/* Olympiad Admin Routes */}
          <Route path="olympiad" element={<OlympiadAdminDashboard />} />
          <Route path="olympiad/list" element={<OlympiadList />} />
          <Route path="olympiad/new" element={<OlympiadForm />} />
          <Route path="olympiad/edit/:id" element={<OlympiadForm />} />
          <Route path="olympiad/questions" element={<OlympiadQuestions />} />
          <Route path="olympiad/registrations" element={<OlympiadRegistrations />} />
          <Route path="olympiad/results" element={<OlympiadResults />} />
          <Route path="olympiad/study-materials" element={<AdminOlympiadStudyMaterials />} />
          <Route path="olympiad/rewards" element={<OlympiadRewardsManager />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

/* Renders chatbot on every page except full-screen test interface */
function GlobalChatbot() {
  const location = useLocation();
  // Hide on the focused test-taking screen so it doesn't distract students
  const hidden = /^\/test\/[^/]+$/.test(location.pathname);
  if (hidden) return null;
  return <AIChatbot />;
}

export default App;
