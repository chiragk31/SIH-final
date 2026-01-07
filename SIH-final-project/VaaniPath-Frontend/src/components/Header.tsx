import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Menu, X, LogOut, Trophy, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useState, useRef, useEffect } from 'react'; // Added useRef, useEffect
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion'; // Added framer-motion
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  isAuthenticated?: boolean;
  userType?: 'student' | 'teacher';
  userName?: string;
  onLogout?: () => void;
}

import { useAuth } from '@/contexts/AuthContext';

export const Header = ({ isAuthenticated = false, userType, userName = "User", onLogout }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  // Determine effective user data
  const effectiveIsAuthenticated = isAuthenticated || !!user;
  const effectiveUserName = user?.full_name || userName;
  const effectiveUserType = user?.is_teacher ? 'teacher' : (user ? 'student' : userType);

  // Construct Avatar URL
  const avatarUrl = user?.avatar_url
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : `http://localhost:8000${user.avatar_url}`)
    : "/placeholder-avatar.jpg";

  // Sliding Cursor State
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  // Store the position of the active item to snap back/initialize
  const [activeRect, setActiveRect] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  // Track hovered item to coordinate text color with pill position
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    if (onLogout) onLogout();
    setMobileMenuOpen(false);
    navigate('/landingpage');
  };

  const studentPoints = 850;

  const getNavLinks = () => {
    if (!effectiveIsAuthenticated) {
      return [
        { path: '/landingpage', label: t('common.home') },
        { path: '/login', label: t('common.studentLogin') },
        { path: '/teacherlogin', label: t('common.teacherLogin') },
      ];
    }

    if (effectiveUserType === 'student') {
      return [
        { path: '/homepage', label: t('common.browseCourses') },
        { path: '/enrolled', label: t('common.myCourses') },
        { path: '/community', label: t('common.community') },
        { path: '/rewards', label: t('common.rewards') },
        { path: '/roadmap', label: t('common.aiRoadmap') },
        { path: '/podcast', label: t('common.podcast') },
      ];
    }

    if (effectiveUserType === 'teacher') {
      return [
        { path: '/teacher/dashboard', label: t('common.dashboard') },
        { path: '/teacher/courses', label: t('common.myCourses') },
        { path: '/teacher/upload', label: t('common.uploadContent') },
        { path: '/teacher/quizzes', label: t('common.createQuiz') },
        { path: '/teacher/doubts', label: t('common.studentDoubts') },
      ];
    }

    return [];
  };

  const navLinks = getNavLinks();

  return (
    <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/50 dark:border-slate-700/50 shadow-xl rounded-full px-5 py-2.5 flex items-center gap-6 md:gap-10 transition-all duration-300">

        {/* Logo */}
        <Link
          id="header-logo"
          to={effectiveIsAuthenticated ? (effectiveUserType === 'student' ? '/homepage' : '/teacher/dashboard') : '/landingpage'}
          className="flex items-center space-x-2 pl-2"
        >
          <div className="rounded-full bg-gradient-to-br from-blue-600 to-purple-600 p-1.5 shadow-lg">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-black dark:text-white hidden sm:block">
            {t('header.title')}
          </span>
        </Link>

        {/* Desktop Navigation - Sliding Pill Style */}
        <nav
          id="header-nav"
          className="hidden md:flex items-center relative"
          onMouseLeave={() => {
            setPosition(activeRect);
            setHoveredPath(null);
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
            >
              <NavTab
                link={link}
                setPosition={setPosition}
                setActiveRect={setActiveRect}
                activeRect={activeRect}
                isActive={isActive(link.path)}
                isHovered={hoveredPath === link.path}
                setHoveredPath={setHoveredPath}
                anyHovered={hoveredPath !== null}
              />
            </Link>
          ))}

          <Cursor position={position} />
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-2 pr-1">
          <div className="hidden lg:block">
            {!effectiveIsAuthenticated && <LanguageSwitcher />}
          </div>

          {effectiveIsAuthenticated && effectiveUserType === 'student' && (
            <Link to="/rewards" className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
              <Trophy className="h-3.5 w-3.5" />
              <span className="font-bold text-sm">{studentPoints}</span>
            </Link>
          )}

          <div className="scale-90">
            <ThemeToggle />
          </div>

          {effectiveIsAuthenticated ? (
            <div className="hidden md:block" id="student-profile">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 overflow-hidden ring-2 ring-transparent hover:ring-blue-400/50 transition-all">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage src={avatarUrl} alt={effectiveUserName} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-medium">
                        {effectiveUserName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-2" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{effectiveUserName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {effectiveUserType === 'student' ? 'student@example.com' : 'teacher@example.com'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>{t('common.profile')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t('common.settings')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('common.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full h-10 w-10 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-4 top-24 p-4 rounded-3xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl md:hidden animate-in slide-in-from-top-4 fade-in duration-200">
          <nav className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-4">
              <span className="text-sm font-semibold text-muted-foreground">Menu</span>
              {!effectiveIsAuthenticated && <LanguageSwitcher />}
            </div>

            {effectiveIsAuthenticated && (
              <div
                className="flex items-center gap-3 px-3 py-3 mb-4 bg-muted/50 rounded-2xl cursor-pointer hover:bg-muted transition-colors"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/profile');
                }}
              >
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={avatarUrl} alt={effectiveUserName} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {effectiveUserName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{effectiveUserName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{effectiveUserType}</p>
                </div>
              </div>
            )}

            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive(link.path)
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'hover:bg-muted'
                  }`}
              >
                {link.label}
              </Link>
            ))}

            {effectiveIsAuthenticated && (
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 mt-2 rounded-xl text-sm font-medium hover:bg-red-50 hover:text-red-600 text-muted-foreground flex items-center space-x-2 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('common.logout')}</span>
              </button>
            )}

            {/* Add Settings link for Mobile if authenticated */}
            {effectiveIsAuthenticated && (
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted transition-colors flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>{t('common.settings')}</span>
              </Link>
            )}

          </nav>
        </div>
      )}
    </header>
  );
};

// --- Sub-components for Sliding Effect ---

const NavTab = ({
  link,
  setPosition,
  setActiveRect,
  activeRect,
  isActive,
  isHovered,
  setHoveredPath,
  anyHovered
}: {
  link: { path: string; label: string };
  setPosition: any;
  setActiveRect: any;
  activeRect: any;
  isActive: boolean;
  isHovered: boolean;
  setHoveredPath: (path: string) => void;
  anyHovered: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && ref.current) {
      const { width } = ref.current.getBoundingClientRect();
      const left = ref.current.offsetLeft;

      setActiveRect({ width, opacity: 1, left });

      if (!anyHovered) {
        setPosition({ width, opacity: 1, left });
      }
    }
  }, [isActive, setPosition, setActiveRect, anyHovered]);

  return (
    <div
      ref={ref}
      onMouseEnter={() => {
        if (!ref.current) return;
        setHoveredPath(link.path);
        const { width } = ref.current.getBoundingClientRect();
        setPosition({
          width,
          opacity: 1,
          left: ref.current.offsetLeft,
        });
      }}
      className={`relative z-10 block cursor-pointer px-5 py-2 text-sm font-bold transition-colors duration-200 ${(isHovered || (isActive && !anyHovered)) ? 'text-white' : 'text-black dark:text-white'
        }`}
    >
      {/* We use mix-blend-difference or just simple conditional coloring. 
          For glass UI, conditional color typically looks cleaner than mix-blend with complex backgrounds.
          Since cursor is black/dark-blue, text should be white when active/hovered over. */}
      <span className="relative z-20">{link.label}</span>
    </div>
  );
};

const Cursor = ({ position }: { position: any }) => {
  return (
    <motion.div
      animate={position}
      className="absolute z-0 h-9 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-md"
    />
  );
};
