'use client';

import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardNav } from '@/components/dashboard-nav';
import { UserNav } from '@/components/user-nav';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Home,
  User,
  LogOut,
  Settings,
  Users,
  Shield,
  LayoutDashboard
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EntityDropdown } from '@/components/EntityDropdown';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      redirect('/login');
    }
  }, [isLoading, isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex h-16 items-center px-4 border-b">
          <Skeleton className="h-8 w-32" />
          <div className="ml-auto flex items-center space-x-4">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[125px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    {
      title: 'Home',
      href: '/dashboard',
      icon: Home,
    },
    {
      title: 'Profile',
      href: '/dashboard/profile',
      icon: User,
    },
  ];

  const adminNavItems = [
    {
      title: 'Users',
      href: '/dashboard/admin/users',
      icon: Users,
      permission: 'manage_users',
    },
    {
      title: 'Permissions',
      href: '/dashboard/admin/permissions',
      icon: Shield,
      permission: 'manage_permissions',
    },
    {
      title: 'Settings',
      href: '/dashboard/admin/settings',
      icon: Settings,
      permission: 'manage_settings',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="flex items-center space-x-4 md:space-x-6">
            <span className="font-bold text-xl">SW-Vista</span>
            <DashboardNav items={navItems} />
            <EntityDropdown />
            {user?.isSystemAdmin && <DashboardNav items={adminNavItems} />}
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-red-600 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
            <UserNav />
          </div>
        </div>
      </header>
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
} 