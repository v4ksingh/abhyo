import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Users, Building2, BarChart3, CreditCard,
  Bell, User, LogOut, Menu, X, ChevronDown, GraduationCap, Trophy,
  FileText, Brain, Settings, DollarSign, ClipboardList, TrendingUp, Layers, Globe, Crown, Zap, Calculator, Video, UserCheck, IdCard, Star, Briefcase, FolderTree, Award, UserCog, Receipt, BookMarked
} from 'lucide-react';

import useAuthStore from '../../store/authStore';
import api from '../../lib/api';
import { getImageUrl } from '../../lib/imageUrl';

const navConfig = {
  superadmin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Analytics', icon: TrendingUp, path: '/admin/analytics' },
    { label: 'Tests', icon: BookOpen, path: '/admin/tests' },
    { label: 'Test Categories', icon: FolderTree, path: '/admin/categories' },
    { label: 'Question Bank', icon: Brain, path: '/admin/questions' },
    { label: 'Exam Series', icon: Layers, path: '/admin/exam-series' },
    { label: 'Video Series', icon: Video, path: '/admin/video-series' },
    { label: 'Government Jobs', icon: Briefcase, path: '/admin/government-jobs', badge: 'AI' },
    { label: 'eBook Store', icon: BookMarked, path: '/admin/ebooks', badge: 'NEW' },
    { label: 'Institutes', icon: Building2, path: '/admin/institutes' },
    { label: 'Users', icon: Users, path: '/admin/users' },
    { label: 'Staff', icon: UserCog, path: '/admin/staff' },
    { label: 'Plans', icon: CreditCard, path: '/admin/plans' },
    { label: 'Revenue', icon: DollarSign, path: '/admin/revenue' },
    { label: 'Results', icon: ClipboardList, path: '/admin/results' },
    { label: 'CMS (Pages)', icon: FileText, path: '/admin/cms' },
    { label: 'Emails', icon: Bell, path: '/admin/emails' },
    { label: 'Waitlist', icon: Users, path: '/admin/waitlist' },
    { label: 'Settings', icon: Settings, path: '/admin/settings' },
    { label: 'Olympiad', icon: Trophy, path: '/admin/olympiad', group: 'Olympiad', highlight: false, badge: 'NEW' },
    { label: 'Prizes & Rewards', icon: Award, path: '/admin/olympiad/rewards', group: 'Olympiad' },
    { label: 'Study Materials', icon: BookOpen, path: '/admin/olympiad/study-materials', group: 'Olympiad' },
  ],

  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Analytics', icon: TrendingUp, path: '/admin/analytics' },
    { label: 'Institutes', icon: Building2, path: '/admin/institutes' },
    { label: 'Users', icon: Users, path: '/admin/users' },
    { label: 'Tests', icon: BookOpen, path: '/admin/tests' },
    { label: 'Question Bank', icon: Brain, path: '/admin/questions' },
    { label: 'Government Jobs', icon: Briefcase, path: '/admin/government-jobs', badge: 'AI' },
    { label: 'Revenue', icon: DollarSign, path: '/admin/revenue' },
    { label: 'eBook Store', icon: BookMarked, path: '/admin/ebooks' },
    { label: 'Results', icon: ClipboardList, path: '/admin/results' },
    { label: 'Emails', icon: Bell, path: '/admin/emails' },
    { label: 'Waitlist', icon: Users, path: '/admin/waitlist' },
    { label: 'Olympiad', icon: Trophy, path: '/admin/olympiad', badge: 'NEW' },
    { label: 'Prizes & Rewards', icon: Award, path: '/admin/olympiad/rewards' },
  ],

  accountant: [
    { label: 'Revenue', icon: DollarSign, path: '/admin/revenue' },
    { label: 'Transactions', icon: Receipt, path: '/admin/revenue' },
  ],

  content_manager: [
    { label: 'Tests', icon: BookOpen, path: '/admin/tests' },
    { label: 'Test Categories', icon: FolderTree, path: '/admin/categories' },
    { label: 'Question Bank', icon: Brain, path: '/admin/questions' },
    { label: 'Exam Series', icon: Layers, path: '/admin/exam-series' },
    { label: 'Video Series', icon: Video, path: '/admin/video-series' },
    { label: 'Government Jobs', icon: Briefcase, path: '/admin/government-jobs', badge: 'AI' },
    { label: 'eBook Store', icon: BookMarked, path: '/admin/ebooks', badge: 'NEW' },
  ],

  teacher: [
    { label: 'Question Bank', icon: Brain, path: '/admin/questions' },
  ],

  institute: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/institute/dashboard' },
    { label: 'Analytics', icon: TrendingUp, path: '/institute/analytics' },
    { label: 'Students', icon: GraduationCap, path: '/institute/students' },
    { label: 'Batches', icon: Users, path: '/institute/batches' },
    { label: 'Courses', icon: Video, path: '/institute/courses' },
    { label: 'Certificates', icon: Award, path: '/institute/certificates' },
    { label: 'Live Classes', icon: Video, path: '/institute/live-classes' },

    { label: 'Reviews', icon: Star, path: '/institute/reviews' },
    { label: 'Attendance', icon: UserCheck, path: '/institute/attendance' },
    { label: 'Tests', icon: BookOpen, path: '/institute/tests' },
    { label: 'Announcements', icon: Bell, path: '/institute/announcements' },
    { label: 'ERP', icon: Receipt, path: '/institute/accounts' },
    { label: 'Profile', icon: Building2, path: '/institute/profile' },
    { label: 'Subscription', icon: CreditCard, path: '/institute/subscription', instituteHighlight: true },
    { label: 'Landing Page', icon: Globe, path: '/institutes', external: true },
  ],
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
    { label: 'My Tests', icon: BookOpen, path: '/student/tests' },
    { label: 'My eBooks', icon: BookMarked, path: '/student/ebooks', badge: 'NEW' },
    { label: 'Olympiad', icon: Trophy, path: '/student/olympiad', badge: 'NEW' },
    { label: 'Study Materials', icon: BookOpen, path: '/student/olympiad/study-materials' },
    { label: 'Courses', icon: Video, path: '/student/courses' },
    { label: 'Live Classes', icon: Video, path: '/student/live-classes' },
    { label: 'Results', icon: BarChart3, path: '/student/results' },
    { label: 'Attendance', icon: UserCheck, path: '/student/attendance' },
    { label: 'Leaderboard', icon: Trophy, path: '/student/leaderboard' },
    { label: 'My Certificates', icon: Award, path: '/student/certificates' },
    { label: 'My ID Card', icon: IdCard, path: '/student/id-card' },
    { label: 'Upgrade to Pro', icon: Crown, path: '/student/subscription', highlight: true },
  ],
  instructor: [
    { label: 'My Courses', icon: Video, path: '/instructor/courses' },
    { label: 'Attendance', icon: UserCheck, path: '/instructor/attendance' },
    { label: 'Profile', icon: User, path: '/instructor/profile' },
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [cheapestStudentPlan, setCheapestStudentPlan] = useState(null);
  const [instituteModules, setInstituteModules] = useState(null);
  const [loadingModules, setLoadingModules] = useState(user?.role === 'institute');

  // Fetch cheapest paid student plan for sidebar upgrade badge price
  useEffect(() => {
    if (user?.role !== 'student') return;
    const subStatus = user?.studentSubscriptionStatus;
    const subEnd = user?.studentSubscriptionEndDate;
    const hasAccess = ['active', 'trial'].includes(subStatus) && subEnd && new Date(subEnd) > new Date();
    if (hasAccess) return; // already subscribed, no need
    api.get('/payments/student-plans')
      .then(res => {
        const paid = (res.data.data || []).filter(p => p.price > 0).sort((a, b) => a.price - b.price);
        if (paid.length > 0) setCheapestStudentPlan(paid[0]);
      })
      .catch(() => { });
  }, [user?.role, user?.studentSubscriptionStatus]);

  const toggleMenu = (label) => {
    setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  useEffect(() => {
    if (user?.role === 'institute') {
      api.get('/institute/subscription')
        .then(res => {
          if (res.data.data && res.data.data.activeModules) {
            setInstituteModules(res.data.data.activeModules);
          }
        })
        .catch(() => { })
        .finally(() => setLoadingModules(false));
    }
  }, [user?.role]);

  let navItems = navConfig[user?.role] || [];
  const location = useLocation();

  if (user?.role === 'institute' && instituteModules) {
    navItems = navItems.filter(item => {
      if (item.label === 'Courses' && instituteModules.courses === false) return false;
      if (item.label === 'ERP' && instituteModules.erp === false) return false;
      if (item.label === 'Live Classes' && instituteModules.liveClasses === false) return false;
      if (item.label === 'Certificates' && instituteModules.certificate === false) return false;
      if (item.label === 'Reviews' && instituteModules.reviews === false) return false;
      if (item.label === 'Attendance' && instituteModules.attendance === false) return false;
      return true;
    });
  } else if (user?.role === 'institute' && loadingModules) {
    // Hide restricted items while loading to prevent flicker
    navItems = navItems.filter(item =>
      !['Courses', 'ERP', 'Live Classes', 'Certificates', 'Reviews', 'Attendance'].includes(item.label)
    );
  }

  if (user?.role === 'student' && user?.isOlympiadUser) {
    navItems = navItems.filter(item =>
      ['Olympiad', 'Leaderboard', 'My Certificates'].includes(item.label)
    ).map(item => item.label === 'Olympiad' ? { ...item, label: 'Olympiad Dashboard' } : item);
  }

  // Route level enforcement
  useEffect(() => {
    if (user?.role === 'institute' && instituteModules) {
      const path = location.pathname;
      let restricted = false;
      if (path.includes('/institute/courses') && instituteModules.courses === false) restricted = true;
      if (path.includes('/institute/accounts') && instituteModules.erp === false) restricted = true;
      if (path.includes('/institute/live-classes') && instituteModules.liveClasses === false) restricted = true;
      if (path.includes('/institute/certificates') && instituteModules.certificate === false) restricted = true;
      if (path.includes('/institute/reviews') && instituteModules.reviews === false) restricted = true;
      if (path.includes('/institute/attendance') && instituteModules.attendance === false) restricted = true;

      if (restricted) {
        navigate('/institute/dashboard', { replace: true });
      }
    }
  }, [location.pathname, instituteModules, user?.role, navigate]);

  useEffect(() => {
    if (user?.role === 'student' && user?.isOlympiadUser) {
      const path = location.pathname;
      const allowedPaths = [
        '/student/olympiad',
        '/student/leaderboard',
        '/student/certificates',
        '/student/profile',
        '/student/notifications'
      ];
      const isAllowed = allowedPaths.some(p => path.startsWith(p));
      if (!isAllowed && path.startsWith('/student')) {
        navigate('/student/olympiad', { replace: true });
      }
    }
  }, [location.pathname, user?.role, user?.isOlympiadUser, navigate]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setUnreadCount(res.data.unreadCount || 0);
      } catch { }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabels = {
    superadmin: 'Super Admin',
    admin: 'Admin',
    accountant: 'Accountant',
    content_manager: 'Content Manager',
    teacher: 'Teacher',
    institute: 'Institute',
    student: 'Student',
    instructor: 'Instructor',
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed flex flex-col left-0 top-0 h-full z-30 w-64 bg-white/95 backdrop-blur-xl border-r border-slate-200
                    transform transition-transform duration-300 lg:translate-x-0 lg:static lg:flex-shrink-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200">
          <img src="/logo.png" alt="Abhyo" className="h-12 w-auto flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-indigo-500/80 uppercase tracking-widest">
              {user?.role === 'student' && user?.isOlympiadUser ? 'Olympiad Student' : roleLabels[user?.role]}
            </p>
          </div>
          <button
            className="ml-auto lg:hidden text-slate-400 hover:text-slate-700 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto sidebar-scroll">
          {navItems.map((item) => {
            if (item.children) {
              const isOpen = expandedMenus[item.label];
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`sidebar-item w-full justify-between ${isOpen ? 'bg-slate-100 text-slate-900' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown size={14} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="pl-6 space-y-1 pb-1">
                      {item.children.map(child => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          onClick={() => setSidebarOpen(false)}
                          className={({ isActive }) =>
                            `sidebar-item !py-1.5 !px-2 !text-xs ${isActive ? 'active' : ''}`
                          }
                        >
                          <span className="opacity-80 hover:opacity-100">{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return item.external ? (
              <a
                key={item.path}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-item"
              >
                <item.icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
                <span>{item.label}</span>
                <span className="ml-auto text-xs opacity-80 group-hover:opacity-100 transition-opacity">↗</span>
              </a>
            ) : item.highlight ? (
              // Special highlighted upgrade link for student
              (() => {
                const subStatus = user?.studentSubscriptionStatus;
                const subEnd = user?.studentSubscriptionEndDate;
                const hasAccess = ['active', 'trial'].includes(subStatus) && subEnd && new Date(subEnd) > new Date();
                if (hasAccess) {
                  // Show a subtle "My Plan" link instead of upgrade CTA
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `sidebar-item ${isActive ? 'active' : ''}`
                      }
                    >
                      <item.icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
                      <span>My Plan</span>
                      {subStatus === 'trial' && (
                        <span className="ml-auto text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full">Trial</span>
                      )}
                    </NavLink>
                  );
                }
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `sidebar-item !bg-gradient-to-r !from-violet-500/10 !to-indigo-500/10 !text-violet-700 hover:!from-violet-500/20 hover:!to-indigo-500/20 border border-violet-200 ${isActive ? 'ring-1 ring-violet-400' : ''}`
                    }
                  >
                    <item.icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
                    <span className="font-bold">{item.label}</span>
                    <span className="ml-auto text-[10px] font-black bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-2 py-0.5 rounded-full">
                      {cheapestStudentPlan ? `₹${cheapestStudentPlan.price}` : 'Pro'}
                    </span>
                  </NavLink>
                );
              })()
            ) : item.instituteHighlight ? (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <item.icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
                <span>{item.label}</span>
                <span className="ml-auto text-[10px] font-black bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-2 py-0.5 rounded-full">
                  Plans
                </span>
              </NavLink>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <item.icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-slate-200 space-y-1">
          {/* Pro/Trial status badge for students (hidden for Olympiad students) */}
          {user?.role === 'student' && !user?.isOlympiadUser && (() => {
            const subStatus = user?.studentSubscriptionStatus;
            const subEnd = user?.studentSubscriptionEndDate;
            const endDate = subEnd ? new Date(subEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null;
            if (subStatus === 'active' && subEnd && new Date(subEnd) > new Date()) {
              return (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-200 mb-2">
                  <Crown size={14} className="text-violet-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-violet-700 leading-tight">Pro Active</p>
                    <p className="text-[10px] text-violet-500">Until {endDate}</p>
                  </div>
                  <Zap size={12} className="text-violet-400 ml-auto flex-shrink-0" />
                </div>
              );
            }
            if (subStatus === 'trial' && subEnd && new Date(subEnd) > new Date()) {
              const daysLeft = Math.max(0, Math.ceil((new Date(subEnd) - new Date()) / 86400000));
              return (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300 mb-2">
                  <span className="text-base flex-shrink-0">🎁</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-amber-700 leading-tight">Free Trial</p>
                    <p className="text-[10px] text-amber-600">{daysLeft}d left · ends {endDate}</p>
                  </div>
                </div>
              );
            }
            return null;
          })()}
          <NavLink
            to={`/${user?.role === 'superadmin' ? 'admin' : user?.role}/notifications`}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Bell className="w-4.5 h-4.5" size={18} />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="ml-auto bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
          <button onClick={handleLogout} className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="relative z-50 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center px-4 lg:px-6 flex-shrink-0">
          <button
            className="lg:hidden text-slate-500 hover:text-slate-900 mr-3"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Search placeholder */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search tests, students..."
                className="input-field !py-2 !pl-9 text-sm w-full"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Notifications */}
            <NavLink
              to={`/${user?.role === 'superadmin' ? 'admin' : user?.role}/notifications`}
              className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
              )}
            </NavLink>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {user?.avatar ? (
                  <img
                    src={getImageUrl(user.avatar)}
                    alt={user?.name || 'User'}
                    className="w-8 h-8 rounded-lg object-cover bg-slate-100"
                    onError={e => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className={`w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm ${user?.avatar ? 'hidden' : ''}`}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-bold text-slate-900 leading-tight">{user?.name || 'User'}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {user?.role === 'student' && user?.isOlympiadUser ? 'Olympiad Student' : roleLabels[user?.role]}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500 hidden md:block" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-12 w-48 card !p-2 z-50 animate-fade-in">
                  <NavLink
                    to={`/${user?.role === 'superadmin' ? 'admin' : user?.role}/profile`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </NavLink>
                  {user?.role === 'student' && (
                    <NavLink
                      to="/student/id-card"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <IdCard className="w-4 h-4" />
                      My ID Card
                    </NavLink>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 w-full transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
