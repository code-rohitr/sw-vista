'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // Layout will show skeleton
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to SW-Vista</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          You are logged in as {user?.username}
          {user?.isSystemAdmin && ' (Administrator)'}
        </p>
      </CardContent>
    </Card>
  );
} 