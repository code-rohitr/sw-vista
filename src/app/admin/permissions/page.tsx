'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PermissionsManagementPage() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [newPermission, setNewPermission] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  
  const { toast } = useToast();

  // Fetch permissions and roles on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('Not authenticated');

        // Fetch permissions
        const permissionsResponse = await fetch('/api/permissions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!permissionsResponse.ok) throw new Error('Failed to fetch permissions');
        const permissionsData = await permissionsResponse.json();
        setPermissions(permissionsData);

        // Fetch roles
        const rolesResponse = await fetch('/api/roles', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!rolesResponse.ok) throw new Error('Failed to fetch roles');
        const rolesData = await rolesResponse.json();
        setRoles(rolesData);
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

    fetchData();
  }, [toast]);

  const handleOpenDialog = () => {
    setNewPermission('');
    setSelectedRoleId('');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleAddPermission = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      // Check if permission already exists
      if (permissions.includes(newPermission)) {
        // If permission exists, add it to the selected role
        const response = await fetch('/api/permissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            role_id: selectedRoleId,
            permission: newPermission
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to add permission to role');
        }

        // Update roles list with the updated role
        setRoles(roles.map(role => role.id === parseInt(selectedRoleId) ? data : role));
        
        toast({
          title: 'Success',
          description: `Permission "${newPermission}" added to role successfully`,
        });
      } else {
        // If permission doesn't exist, create it and add to the selected role
        const response = await fetch('/api/permissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            role_id: selectedRoleId,
            permission: newPermission
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to create permission');
        }

        // Update permissions list
        setPermissions([...permissions, newPermission]);
        
        // Update roles list with the updated role
        setRoles(roles.map(role => role.id === parseInt(selectedRoleId) ? data : role));
        
        toast({
          title: 'Success',
          description: `New permission "${newPermission}" created and added to role successfully`,
        });
      }
      
      handleCloseDialog();
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

  if (isLoading && permissions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">Loading permissions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Permissions Management</h2>
        <Button onClick={handleOpenDialog}>Add Permission to Role</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>All Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permission Name</TableHead>
                  <TableHead>Used By Roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((permission) => (
                  <TableRow key={permission}>
                    <TableCell>{permission}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {roles
                          .filter(role => role.permissions.includes(permission))
                          .map(role => (
                            <span 
                              key={role.id} 
                              className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs"
                            >
                              {role.role_name}
                            </span>
                          ))
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Roles and Their Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Permissions Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>{role.role_name}</TableCell>
                    <TableCell>{role.permissions.length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Permission to Role</DialogTitle>
            <DialogDescription>
              Add an existing permission or create a new one and assign it to a role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Select Role</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="permission">Permission</Label>
              <div className="flex space-x-2">
                <Select 
                  value={newPermission} 
                  onValueChange={setNewPermission}
                  disabled={permissions.length === 0}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select or type a permission" />
                  </SelectTrigger>
                  <SelectContent>
                    {permissions.map((permission) => (
                      <SelectItem key={permission} value={permission}>
                        {permission}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-gray-500 flex items-center">or</span>
                <Input
                  placeholder="Create new permission"
                  value={newPermission}
                  onChange={(e) => setNewPermission(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddPermission}
              disabled={!selectedRoleId || !newPermission}
            >
              Add Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}