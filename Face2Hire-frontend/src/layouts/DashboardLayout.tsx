import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, updateUser } from '../store/slices/authSlice';
import axiosClient from '../services/axiosClient';
import {
  Home, FileText, Upload, BarChart2, Settings, LogOut, User,
  Briefcase, Calendar, Users, Activity, FileBarChart,
  Mail, Trophy, Menu, X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Badge } from '../components/ui/badge';
import { useEffect, useState,  type JSX } from 'react';
import type { RootState, AppDispatch } from '../store/store';
import NotificationBell from '../components/NotificationBell';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

export default function DashboardLayout(): JSX.Element | null {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isMobile) {
        setSidebarOpen(false);
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [location.pathname, isMobile]);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    const fetchProfileImage = async (): Promise<void> => {
      if (!user?.profileImageUrl && token) {
        try {
          const res = await axiosClient.get<{ data: { profileImageUrl?: string } }>('/profile');
          const profileData = res.data.data;
          if (profileData.profileImageUrl) {
            dispatch(updateUser({ profileImageUrl: profileData.profileImageUrl }));
          }
        } catch (error) {
          console.error('Failed to fetch profile image:', error);
        }
      }
    };
    fetchProfileImage();
  }, [user, token, dispatch]);

  if (!user) return null;

  const role = user.role?.toLowerCase();
  const settingsPath = `/${role}/settings`;
  const logoLink = role ? `/${role}` : '/';

  const getNavItems = (): NavItem[] => {
    if (role === 'interviewee') {
      return [
        { icon: Home, label: 'Dashboard', path: '/interviewee' },
        { icon: Briefcase, label: 'Browse Jobs', path: '/interviewee/jobs' },
        { icon: Upload, label: 'Upload CV', path: '/interviewee/upload-cv' },
        { icon: FileText, label: 'My Applications', path: '/interviewee/applications' },
        { icon: Calendar, label: 'Upcoming Interviews', path: '/interviewee/upcoming' },
        { icon: FileText, label: 'History', path: '/interviewee/history' },
        { icon: BarChart2, label: 'Analytics', path: '/interviewee/analytics' },
        { icon: Settings, label: 'Settings', path: settingsPath },
      ];
    } else if (role === 'interviewer') {
      return [
        { icon: Home, label: 'Dashboard', path: '/interviewer' },
        { icon: Briefcase, label: 'My Jobs', path: '/interviewer/jobs' },
        { icon: FileText, label: 'Applications', path: '/interviewer/applications' },
        { icon: Calendar, label: 'Schedule Interview', path: '/interviewer/schedule' },
        { icon: Calendar, label: 'Scheduled Interviews', path: '/interviewer/scheduled' },
        { icon: Settings, label: 'Settings', path: settingsPath },
      ];
    } else if (role === 'admin') {
      return [
        { icon: Home, label: 'Dashboard', path: '/admin' },
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: Activity, label: 'Interviews', path: '/admin/interviews' },
        { icon: Briefcase, label: 'Jobs', path: '/admin/jobs' },
        { icon: FileBarChart, label: 'Activities', path: '/admin/activities' },
        { icon: FileBarChart, label: 'Reports', path: '/admin/reports' },
        { icon: Mail, label: 'Send Email', path: '/admin/email' },
        { icon: Trophy, label: 'Badges', path: '/admin/badges' },
        { icon: Settings, label: 'Settings', path: settingsPath },
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  const handleLogout = (): void => {
    dispatch(logout());
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside 
        className={`
          fixed md:relative z-50
          w-64 bg-white border-r border-gray-200 flex flex-col
          transition-transform duration-300 ease-in-out
          ${isMobile ? (
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          ) : 'translate-x-0'}
          h-full
        `}
      >
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
          >
            <X className="size-5 text-gray-600" />
          </button>
        )}

        <div className="p-6 border-b border-gray-200">
          <Link to={logoLink} className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <span className="font-bold text-white text-sm">FH</span>
            </div>
            <span className="font-bold text-lg">Face2Hire</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="size-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <div className="flex items-center gap-3 px-2 py-2">
            <Badge
              variant={role === 'admin' ? 'destructive' : role === 'interviewer' ? 'default' : 'secondary'}
              className="uppercase text-xs"
            >
              {user.role}
            </Badge>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 size-5" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col w-full overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle sidebar"
              >
                <Menu className="size-5 text-gray-700" />
              </button>
            )}
            
            {isMobile && (
              <span className="font-medium text-gray-900">
                {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="size-8">
                    <AvatarImage src={user?.profileImageUrl} />
                    <AvatarFallback><User className="size-4" /></AvatarFallback>
                  </Avatar>
                  <span className="font-medium hidden sm:inline">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(settingsPath)}>
                  <Settings className="mr-2 size-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 size-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}