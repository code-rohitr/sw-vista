'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Calendar,
  Layers,
  UserCog,
  CheckCircle2,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout, isSystemAdmin } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in
    if (!isLoading && !user) {
      toast({
        title: 'Access denied',
        description: 'You must be logged in to access this page',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, [user, isLoading, router, toast]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      show: isSystemAdmin,
    },
    {
      name: 'Entities',
      href: '/admin/entities',
      icon: Building2,
      show: isSystemAdmin,
    },
    {
      name: 'Entity Types',
      href: '/admin/entity-types',
      icon: Layers,
      show: isSystemAdmin,
    },
    {
      name: 'Roles',
      href: '/admin/roles',
      icon: UserCog,
      show: isSystemAdmin,
    },
    {
      name: 'Entity Approvers',
      href: '/admin/entity-approvers',
      icon: CheckCircle2,
      show: isSystemAdmin,
    },
    {
      name: 'Venues',
      href: '/venues',
      icon: Calendar,
      show: true,
    },
    {
      name: 'Permissions',
      href: '/admin/permissions',
      icon: Shield,
      show: isSystemAdmin,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      show: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out z-50 
          ${isSidebarOpen ? 'w-64' : 'w-20'} border-r border-gray-200 dark:border-gray-700`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and toggle */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className={`font-bold text-xl ${!isSidebarOpen && 'hidden'}`}>SW-Vista</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.filter(item => item.show).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                  ${router.pathname === item.href ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <item.icon size={20} />
                {isSidebarOpen && <span>{item.name}</span>}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="w-full flex items-center justify-center"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="w-full flex items-center justify-center text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500"
            >
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Welcome, {user?.username}</h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {isSystemAdmin ? 'System Admin' : 'User'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 