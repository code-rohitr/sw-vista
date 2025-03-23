'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Moon, Sun } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout, isSystemAdmin } = useAuth();
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
    } else {
      // Check system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', isDark);
    }
  }, [router, toast]);


  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
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
          <h2 className="text-xl font-bold text-black dark:text-white">SW-Vista</h2>
          <p className="text-sm text-black/70 dark:text-white/70">
            {user?.username}
          </p>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link href="/dashboard" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/dashboard/profile" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white">
                Profile
              </Link>
            </li>
            {/* Entity Memberships */}
            {user?.entityMembers && user.entityMembers.length > 0 && (
              <li className="pt-4">
                <h3 className="text-sm font-semibold text-black/70 dark:text-white/70 uppercase tracking-wider mb-2">
                  Your Entities
                </h3>
                <ul className="space-y-1">
                  {user.entityMembers.map((membership, index) => (
                    <li key={index}>
                      <Link 
                        href={`/entities/${membership.entity.id}`} 
                        className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white"
                      >
                        {membership.entity.name}
                        <span className="text-sm text-black/50 dark:text-white/50 block">
                          {membership.entityRole.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            )}
            
            {/* System Admin Link */}
            {isSystemAdmin() && (
              <li>
                <Link href="/admin" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white">
                  Admin Panel
                </Link>
              </li>
            )}
          </ul>
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
          <h1 className="text-xl font-bold text-black dark:text-white">Dashboard</h1>
          
          {/* Theme toggle button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-black dark:text-white transition-transform duration-300 hover:scale-110"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 transition-all duration-300 rotate-0" />
            ) : (
              <Sun className="h-5 w-5 transition-all duration-300 rotate-90" />
            )}
          </button>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
