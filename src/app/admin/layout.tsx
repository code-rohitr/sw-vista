'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in and has godmode role
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');

    if (!storedUser || !token) {
      toast({
        title: 'Access denied',
        description: 'You must be logged in to access this page',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      if (parsedUser.role !== 'godmode') {
        toast({
          title: 'Access denied',
          description: 'You do not have permission to access the admin area',
          variant: 'destructive',
        });
        router.push('/dashboard');
        return;
      }
    } catch (error) {
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router, toast]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black text-black dark:text-white">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-black">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-black shadow-md border-r border-black dark:border-white">
        <div className="p-4 border-b border-black dark:border-white">
          <h2 className="text-xl font-bold text-black dark:text-white">SW-Vista Admin</h2>
          <p className="text-sm text-black/70 dark:text-white/70">
            {user?.username} ({user?.role})
          </p>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link href="/admin/dashboard" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin/users" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white">
                User Management
              </Link>
            </li>
            <li>
              <Link href="/admin/roles" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white">
                Role Management
              </Link>
            </li>
            <li>
              <Link href="/admin/permissions" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white">
                Permissions
              </Link>
            </li>
            <li>
              <Link href="/admin/audit-logs" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white">
                Audit Logs
              </Link>
            </li>
          </ul>
        </nav>
        <div className="p-4 border-t border-black dark:border-white">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-white dark:bg-black">
        <header className="bg-white dark:bg-black shadow-sm p-4 border-b border-black dark:border-white flex justify-between items-center">
          <h1 className="text-xl font-bold text-black dark:text-white">Admin Dashboard</h1>
          
          {/* Theme toggle button */}
          <ThemeToggle />
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}