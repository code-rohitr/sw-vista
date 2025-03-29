'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout, isSystemAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in and is System Admin
    if (!isLoading && (!user || !isSystemAdmin())) {
      toast({
        title: 'Access denied',
        description: 'You must be a System Admin to access this page',
        variant: 'destructive',
      });
      router.push('/dashboard');
    }
  }, [user, isLoading, isSystemAdmin, router, toast]);

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
            {user?.username} (System Admin)
          </p>
        </div>
        <nav className="p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-black/70 dark:text-white/70 uppercase tracking-wider mb-2">
              General
            </h3>
            <ul className="space-y-1">
              <li>
                <Link href="/admin/dashboard" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/admin/audit-logs" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white">
                  Audit Logs
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-black/70 dark:text-white/70 uppercase tracking-wider mb-2">
              IAM System
            </h3>
            <ul className="space-y-1">
              <li>
                <Link href="/admin/users" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white">
                  Users
                </Link>
              </li>
              <li>
                <Link href="/admin/resources" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white">
                  Resources
                </Link>
              </li>
              <li>
                <Link href="/admin/permissions" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white">
                  Permission Types
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-black/70 dark:text-white/70 uppercase tracking-wider mb-2">
              Entities & Roles
            </h3>
            <ul className="space-y-1">
              <li>
                <Link href="/admin/entity-types" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white">
                  Entity Types
                </Link>
              </li>
              <li>
                <Link href="/admin/entities" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white">
                  Entities
                </Link>
              </li>
              <li>
                <Link href="/admin/entity-roles" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white">
                  Entity Roles
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-black/70 dark:text-white/70 uppercase tracking-wider mb-2">
              Venue Management
            </h3>
            <ul className="space-y-1">
              <li>
                <Link href="/admin/venues" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white">
                  Venues
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        <div className="p-4 border-t border-black dark:border-white">
          <Button variant="outline" className="w-full" onClick={logout}>
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
