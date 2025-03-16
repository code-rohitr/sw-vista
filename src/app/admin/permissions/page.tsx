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
  const [permissions, setPermissions] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [permissionName, setPermissionName] = useState('');
  const [permissionDescription, setPermissionDescription] = useState('');
  const [permissionAction, setPermissionAction] = useState('view');
  
  const { toast } = useToast();

  // Fetch permissions, resources, and roles on component mount
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

        // Fetch resources
        const resourcesResponse = await fetch('/api/resources', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!resourcesResponse.ok) throw new Error('Failed to fetch resources');
        const resourcesData = await resourcesResponse.json();
        setResources(resourcesData);

        // Fetch roles
        const rolesResponse = await fetch('/api/roles', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!rolesResponse.ok) throw new Error('Failed to fetch roles');
        const rolesData = await rolesResponse.json();
        
        // Fetch role permissions for each role
        const rolesWithPermissions = await Promise.all(
          rolesData.map(async (role: any) => {
            const permissionsResponse = await fetch(`/api/roles/${role.id}/permissions`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (permissionsResponse.ok) {
              const permissionsData = await permissionsResponse.json();
              return {
                ...role,
                rolePermissions: permissionsData
              };
            }
            
            return {
              ...role,
              rolePermissions: []
            };
          })
        );
        
        setRoles(rolesWithPermissions);
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
    setPermissionName('');
    setPermissionDescription('');
    setPermissionAction('view');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleCreatePermission = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: permissionName,
          description: permissionDescription,
          action: permissionAction
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create permission');
      }

      // Update permissions list
      setPermissions([...permissions, data]);
      
      toast({
        title: 'Success',
        description: `Permission "${permissionName}" created successfully`,
      });
      
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

  // Count how many roles use a specific permission
  const getPermissionUsageCount = (permissionId: number) => {
    return roles.reduce((count, role) => {
      const hasPermission = role.rolePermissions.some((rp: any) => rp.permission_id === permissionId);
      return hasPermission ? count + 1 : count;
    }, 0);
  };

  // Get roles that use a specific permission
  const getRolesUsingPermission = (permissionId: number) => {
    return roles.filter(role => 
      role.rolePermissions.some((rp: any) => rp.permission_id === permissionId)
    );
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
        <Button onClick={handleOpenDialog}>Create New Permission</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Used By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell>{permission.id}</TableCell>
                  <TableCell>{permission.name}</TableCell>
                  <TableCell>{permission.description || '-'}</TableCell>
                  <TableCell>{permission.action}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getRolesUsingPermission(permission.id).map(role => (
                        <span 
                          key={role.id} 
                          className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs"
                        >
                          {role.name}
                        </span>
                      ))}
                      {getPermissionUsageCount(permission.id) === 0 && (
                        <span className="text-gray-500 text-xs">Not used</span>
                      )}
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
                <TableHead>Permissions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>{role.rolePermissions ? role.rolePermissions.length : 0}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.rolePermissions && role.rolePermissions.map((rp: any) => (
                        <span 
                          key={rp.id} 
                          className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs"
                          title={`${rp.permission?.action} on ${rp.resource?.name}`}
                        >
                          {rp.permission?.name}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Permission</DialogTitle>
            <DialogDescription>
              Create a new permission that can be assigned to roles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="permissionName">Permission Name</Label>
              <Input
                id="permissionName"
                value={permissionName}
                onChange={(e) => setPermissionName(e.target.value)}
                placeholder="Enter permission name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="permissionDescription">Description</Label>
              <Input
                id="permissionDescription"
                value={permissionDescription}
                onChange={(e) => setPermissionDescription(e.target.value)}
                placeholder="Enter permission description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="permissionAction">Action</Label>
              <Select 
                value={permissionAction} 
                onValueChange={setPermissionAction}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="manage">Manage (All)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePermission}
              disabled={!permissionName || !permissionAction}
            >
              Create Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
