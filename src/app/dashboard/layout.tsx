'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Moon, Sun } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in
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
    } catch (error) {
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      router.push('/login');
    } finally {
      setIsLoading(false);
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    router.push('/login');
  };

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
            {user?.role === 'godmode' && (
              <li>
                <Link href="/admin" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white">
                  Admin Panel
                </Link>
              </li>
            )}
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