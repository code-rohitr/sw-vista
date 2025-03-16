'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function UserDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      
      // If user is godmode, redirect to admin dashboard
      if (parsedUser.role === 'godmode') {
        router.push('/admin/dashboard');
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">SW-Vista Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <div className="font-medium">{user?.username}</div>
              <div className="text-gray-500">{user?.role}</div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-6 px-4">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Welcome, {user?.username}!</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>Your account information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Username:</span>
                    <span>{user?.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Role:</span>
                    <span className="capitalize">{user?.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Account Created:</span>
                    <span>{new Date(user?.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Your Permissions</CardTitle>
                <CardDescription>What you can do in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user?.role === 'editor' ? (
                    <>
                      <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded text-xs">read</span>
                      <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded text-xs">write</span>
                      <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded text-xs">edit</span>
                    </>
                  ) : user?.role === 'viewer' ? (
                    <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded text-xs">read</span>
                  ) : (
                    <span className="text-gray-500">No specific permissions</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>System Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${user?.role !== 'editor' && 'opacity-50'}`}>
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-medium">Content Management</div>
                    <div className="text-sm text-gray-500">
                      {user?.role === 'editor' ? 'Full access' : 'View only'}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-medium">Reports</div>
                    <div className="text-sm text-gray-500">View reports</div>
                  </CardContent>
                </Card>
                
                <Card className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${user?.role !== 'editor' && 'opacity-50'}`}>
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-medium">Settings</div>
                    <div className="text-sm text-gray-500">
                      {user?.role === 'editor' ? 'Manage settings' : 'View only'}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                  <div>
                    <div className="font-medium">Logged in</div>
                    <div className="text-sm text-gray-500">{new Date().toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                  <div>
                    <div className="font-medium">Profile viewed</div>
                    <div className="text-sm text-gray-500">{new Date(Date.now() - 5 * 60000).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-purple-500"></div>
                  <div>
                    <div className="font-medium">System access granted</div>
                    <div className="text-sm text-gray-500">{new Date(Date.now() - 24 * 60 * 60000).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Password</div>
                    <div className="text-sm text-gray-500">Last changed 30 days ago</div>
                  </div>
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Two-Factor Authentication</div>
                    <div className="text-sm text-gray-500">Not enabled</div>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Session</div>
                    <div className="text-sm text-gray-500">Active for {Math.floor(Math.random() * 60)} minutes</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    End Session
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <footer className="bg-white dark:bg-gray-800 shadow-sm p-4 border-t border-gray-200 dark:border-gray-700 mt-6">
        <div className="container mx-auto text-center text-sm text-gray-500">
          <p>SW-Vista Authentication System &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}