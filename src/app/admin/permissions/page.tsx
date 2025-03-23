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
  const [entityRoles, setEntityRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [permissionName, setPermissionName] = useState('');
  const [permissionDescription, setPermissionDescription] = useState('');
  const [permissionAction, setPermissionAction] = useState('view');
  
  const { toast } = useToast();

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

        // Fetch entity roles
        const entityRolesResponse = await fetch('/api/entity-roles', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!entityRolesResponse.ok) throw new Error('Failed to fetch entity roles');
        const entityRolesData = await entityRolesResponse.json();
        
        // Get permissions for each entity role
        const rolesWithPermissions = await Promise.all(
          entityRolesData.map(async (role: any) => {
            const rolePermissionsResponse = await fetch(`/api/entity-role-permissions?entityRoleId=${role.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (rolePermissionsResponse.ok) {
              const permissionsData = await rolePermissionsResponse.json();
              return {
                ...role,
                entityRolePermissions: permissionsData
              };
            }
            
            return {
              ...role,
              entityRolePermissions: []
            };
          })
        );
        
        setEntityRoles(rolesWithPermissions);
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

  // Count how many entity roles use a specific permission
  const getPermissionUsageCount = (permissionId: number) => {
    return entityRoles.reduce((count, role) => {
      const hasPermission = role.entityRolePermissions.some((rp: any) => rp.permission_id === permissionId);
      return hasPermission ? count + 1 : count;
    }, 0);
  };

  // Get entity roles that use a specific permission
  const getEntityRolesUsingPermission = (permissionId: number) => {
    return entityRoles.filter(role => 
      role.entityRolePermissions.some((rp: any) => rp.permission_id === permissionId)
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
        <h2 className="text-2xl font-bold">Permission Types</h2>
        <Button onClick={handleOpenDialog}>Create New Permission Type</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Permission Types</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Used By Entity Roles</TableHead>
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
                      {getEntityRolesUsingPermission(permission.id).map(role => (
                        <span 
                          key={role.id} 
                          className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs"
                          title={`${role.entity?.name || 'System'}`}
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
          <CardTitle>Entity Roles and Their Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entity Role</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Permissions Count</TableHead>
                <TableHead>Permissions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entityRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>{role.entity?.name || 'System'}</TableCell>
                  <TableCell>{role.entityRolePermissions ? role.entityRolePermissions.length : 0}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.entityRolePermissions && role.entityRolePermissions.map((rp: any) => (
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
            <DialogTitle>Create New Permission Type</DialogTitle>
            <DialogDescription>
              Create a new permission type that can be assigned to entity roles.
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
