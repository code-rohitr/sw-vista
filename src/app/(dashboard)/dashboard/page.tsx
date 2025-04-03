'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Shield, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const { user, isSystemAdmin } = useAuth();

  const stats = [
    {
      title: 'Total Entities',
      value: '12',
      description: 'Active entities in the system',
      icon: Building2,
    },
    {
      title: 'Total Users',
      value: '48',
      description: 'Registered users',
      icon: Users,
    },
    {
      title: 'Active Roles',
      value: '8',
      description: 'Role templates in use',
      icon: Shield,
    },
    {
      title: 'Recent Bookings',
      value: '24',
      description: 'Bookings this month',
      icon: Calendar,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Welcome back, {user?.username}. Here's an overview of your system.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest actions and updates in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* This would be populated with real data from your API */}
            <div className="flex items-center space-x-4">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium">New user registered</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <div>
                <p className="text-sm font-medium">Venue booking created</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <div>
                <p className="text-sm font-medium">Role template updated</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">1 hour ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 