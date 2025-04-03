'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  created_at: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
}

export default function UserActivityPage({ params }: { params: { id: string } }) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ username: string } | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      setUser(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch user details',
        variant: 'destructive',
      });
    }
  }, [params.id, toast]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${params.id}/audit-logs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      const data = await response.json();
      setAuditLogs(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch audit logs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [params.id, toast]);

  useEffect(() => {
    fetchUser();
    fetchAuditLogs();
  }, [fetchUser, fetchAuditLogs]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <div>Loading activity logs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">
          Activity Log - {user?.username}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-muted-foreground">No activity logs found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.created_at), 'PPpp')}
                    </TableCell>
                    <TableCell className="capitalize">
                      {log.action.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell className="capitalize">
                      {log.entity_type.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell>
                      {log.details ? (
                        <pre className="whitespace-pre-wrap text-sm">
                          {typeof log.details === 'string' 
                            ? JSON.stringify(JSON.parse(log.details), null, 2)
                            : JSON.stringify(log.details, null, 2)}
                        </pre>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 