import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { BookOpen, FileText, Home, LogOut, User } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: '홈' },
    { path: '/dashboard/theory', icon: BookOpen, label: '이론 학습' },
    { path: '/dashboard/problems', icon: FileText, label: '문제 풀이' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EEEEFF' }}>
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-purple-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">CoCo</span>
                <span className="text-gray-800">AI</span>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                        : 'text-gray-700 hover:bg-purple-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Profile Button */}
              <Link to="/dashboard/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`ml-2 ${
                    location.pathname === '/dashboard/profile'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Avatar className="w-8 h-8 mr-2">
                    <AvatarFallback className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span>프로필</span>
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="ml-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}