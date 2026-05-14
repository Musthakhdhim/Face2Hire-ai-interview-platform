import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, updateUser } from '../store/slices/authSlice';
import axiosClient from '../services/axiosClient';
import {
  Home, FileText, Upload, BarChart2, Settings, LogOut, Bell, Search, User,
  Briefcase, Calendar, Users, Activity, FileBarChart,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Badge } from '../components/ui/badge';
import { useEffect, type JSX } from 'react';
import type { RootState, AppDispatch } from '../store/store';

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
        { icon: Briefcase, label: 'Browse Jobs', path: '#' },
        { icon: Upload, label: 'Upload CV', path: '#' },
        { icon: Calendar, label: 'Upcoming Interviews', path: '#' },
        { icon: FileText, label: 'History', path: '#' },
        { icon: BarChart2, label: 'Analytics', path: '#' },
        { icon: Settings, label: 'Settings', path: settingsPath },
      ];
    } else if (role === 'interviewer') {
      return [
        { icon: Home, label: 'Dashboard', path: '/interviewer' },
        { icon: Briefcase, label: 'My Jobs', path: '#' },
        { icon: FileText, label: 'Applications', path: '#' },
        { icon: Calendar, label: 'Schedule Interview', path: '#' },
        { icon: Settings, label: 'Settings', path: settingsPath },
      ];
    } else if (role === 'admin') {
      return [
        { icon: Home, label: 'Dashboard', path: '/admin' },
        { icon: Users, label: 'Users', path: '#' },
        { icon: Activity, label: 'Interviews', path: '#' },
        { icon: FileBarChart, label: 'Reports', path: '#' },
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

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string): void => {
    if (path === '#') e.preventDefault();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <Link to={logoLink} className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <span className="font-bold text-white text-sm">IA</span>
            </div>
            <span className="font-bold text-lg">InterviewAI</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={(e) => handleNavClick(e, item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="size-5" />
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input placeholder="Search..." className="pl-10 bg-gray-50 border-gray-200" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-5" />
              <Badge className="absolute -top-1 -right-1 size-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">3</Badge>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="size-8">
                    <AvatarImage src={user?.profileImageUrl} />
                    <AvatarFallback><User className="size-4" /></AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user?.name}</span>
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
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}