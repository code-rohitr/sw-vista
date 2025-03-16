'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      // Construct URL with filter if needed
      let url = '/api/audit-logs';
      if (filter !== 'all') {
        url += `?action=${filter}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create_user':
      case 'create_role':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'update_user':
      case 'update_role':
      case 'add_permission':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'delete_user':
      case 'delete_role':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  if (isLoading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">Loading audit logs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-black dark:text-white">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Audit Logs</h2>
        <div className="flex items-center space-x-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create_user">Create User</SelectItem>
              <SelectItem value="update_user">Update User</SelectItem>
              <SelectItem value="delete_user">Delete User</SelectItem>
              <SelectItem value="create_role">Create Role</SelectItem>
              <SelectItem value="update_role">Update Role</SelectItem>
              <SelectItem value="delete_role">Delete Role</SelectItem>
              <SelectItem value="add_permission">Add Permission</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => fetchLogs()}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="border-black dark:border-white bg-white dark:bg-black">
        <CardHeader>
          <CardTitle className="text-black dark:text-white">System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-black dark:border-white">
                <TableHead className="text-black dark:text-white">ID</TableHead>
                <TableHead className="text-black dark:text-white">User</TableHead>
                <TableHead className="text-black dark:text-white">Action</TableHead>
                <TableHead className="text-black dark:text-white">Entity Type</TableHead>
                <TableHead className="text-black dark:text-white">Entity ID</TableHead>
                <TableHead className="text-black dark:text-white">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id} className="border-black dark:border-white">
                    <TableCell className="text-black dark:text-white">{log.id}</TableCell>
                    <TableCell className="text-black dark:text-white">{log.user?.username || log.user_id}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-black dark:text-white">{log.entity_type}</TableCell>
                    <TableCell className="text-black dark:text-white">{log.entity_id}</TableCell>
                    <TableCell className="text-black dark:text-white">{new Date(log.timestamp).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-black dark:border-white">
                  <TableCell colSpan={6} className="text-center py-4 text-black dark:text-white">
                    No audit logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}