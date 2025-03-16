'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  
  // Form state
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [isSystemRole, setIsSystemRole] = useState(false);
  const [selectedPermissionId, setSelectedPermissionId] = useState<number | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);
  
  const { toast } = useToast();

  // Fetch roles, permissions, and resources on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('Not authenticated');

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

        // Fetch all permissions
        const permissionsResponse = await fetch('/api/permissions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!permissionsResponse.ok) throw new Error('Failed to fetch permissions');
        const permissionsData = await permissionsResponse.json();
        setPermissions(permissionsData);

        // Fetch all resources
        const resourcesResponse = await fetch('/api/resources', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!resourcesResponse.ok) throw new Error('Failed to fetch resources');
        const resourcesData = await resourcesResponse.json();
        setResources(resourcesData);
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

  const resetForm = () => {
    setRoleName('');
    setRoleDescription('');
    setIsSystemRole(false);
    setSelectedPermissionId(null);
    setSelectedResourceId(null);
    setSelectedRole(null);
    setIsEditMode(false);
  };

  const handleOpenDialog = (role?: any) => {
    resetForm();
    
    if (role) {
      setSelectedRole(role);
      setRoleName(role.name);
      setRoleDescription(role.description || '');
      setIsSystemRole(role.is_system_role);
      setIsEditMode(true);
    }
    
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleCreateRole = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: roleName,
          description: roleDescription,
          is_system_role: isSystemRole
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create role');
      }

      // Update roles list
      setRoles([...roles, {...data, rolePermissions: []}]);
      
      toast({
        title: 'Success',
        description: 'Role created successfully',
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

  const handleUpdateRole = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: roleName,
          description: roleDescription,
          is_system_role: isSystemRole
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update role');
      }

      // Update roles list
      setRoles(roles.map(role => 
        role.id === selectedRole.id 
          ? {...data, rolePermissions: role.rolePermissions} 
          : role
      ));
      
      toast({
        title: 'Success',
        description: 'Role updated successfully',
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

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete role');
      }

      // Update roles list
      setRoles(roles.filter(role => role.id !== roleId));
      
      toast({
        title: 'Success',
        description: 'Role deleted successfully',
      });
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

  const handleAddPermission = async (roleId: number) => {
    if (!selectedPermissionId || !selectedResourceId) {
      toast({
        title: 'Error',
        description: 'Please select both a permission and a resource',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/roles/${roleId}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          permission_id: selectedPermissionId,
          resource_id: selectedResourceId
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add permission');
      }

      // Update roles list
      setRoles(roles.map(role => {
        if (role.id === roleId) {
          return {
            ...role,
            rolePermissions: [...role.rolePermissions, data]
          };
        }
        return role;
      }));
      
      toast({
        title: 'Success',
        description: 'Permission added successfully',
      });
      
      // Reset selection
      setSelectedPermissionId(null);
      setSelectedResourceId(null);
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

  const handleRemovePermission = async (roleId: number, permissionId: number, resourceId: number) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/roles/${roleId}/permissions?permissionId=${permissionId}&resourceId=${resourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to remove permission');
      }

      // Update roles list
      setRoles(roles.map(role => {
        if (role.id === roleId) {
          return {
            ...role,
            rolePermissions: role.rolePermissions.filter((rp: any) => 
              !(rp.permission_id === permissionId && rp.resource_id === resourceId)
            )
          };
        }
        return role;
      }));
      
      toast({
        title: 'Success',
        description: 'Permission removed successfully',
      });
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

  if (isLoading && roles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">Loading roles...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Role Management</h2>
        <Button onClick={() => handleOpenDialog()}>Add New Role</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.id}</TableCell>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>{role.description || '-'}</TableCell>
                  <TableCell>{role.is_system_role ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(role)}>
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={role.name === 'godmode'} // Prevent deleting godmode role
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {roles.map((role) => (
        <Card key={`permissions-${role.id}`}>
          <CardHeader>
            <CardTitle>Permissions for {role.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor={`permission-${role.id}`}>Permission</Label>
                  <Select 
                    value={selectedPermissionId?.toString() || ''} 
                    onValueChange={(value) => setSelectedPermissionId(parseInt(value))}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select permission" />
                    </SelectTrigger>
                    <SelectContent>
                      {permissions.map((permission) => (
                        <SelectItem key={permission.id} value={permission.id.toString()}>
                          {permission.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`resource-${role.id}`}>Resource</Label>
                  <Select 
                    value={selectedResourceId?.toString() || ''} 
                    onValueChange={(value) => setSelectedResourceId(parseInt(value))}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select resource" />
                    </SelectTrigger>
                    <SelectContent>
                      {resources.map((resource) => (
                        <SelectItem key={resource.id} value={resource.id.toString()}>
                          {resource.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => handleAddPermission(role.id)}>
                  Add Permission
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permission</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {role.rolePermissions && role.rolePermissions.length > 0 ? (
                    role.rolePermissions.map((rp: any) => (
                      <TableRow key={rp.id}>
                        <TableCell>{rp.permission?.name || '-'}</TableCell>
                        <TableCell>{rp.permission?.action || '-'}</TableCell>
                        <TableCell>{rp.resource?.name || '-'}</TableCell>
                        <TableCell>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleRemovePermission(role.id, rp.permission_id, rp.resource_id)}
                            disabled={role.name === 'godmode' && rp.permission?.name === 'manage'} // Prevent removing 'manage' from godmode
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">No permissions assigned</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Role' : 'Create New Role'}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update role information.'
                : 'Fill in the details to create a new role.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Enter role name"
                disabled={isEditMode && roleName === 'godmode'} // Prevent editing godmode role name
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleDescription">Description</Label>
              <Input
                id="roleDescription"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Enter role description"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isSystemRole" 
                checked={isSystemRole} 
                onCheckedChange={(checked) => setIsSystemRole(checked === true)}
                disabled={isEditMode && roleName === 'godmode'} // Prevent changing godmode system role status
              />
              <Label htmlFor="isSystemRole">System Role</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={isEditMode ? handleUpdateRole : handleCreateRole}
              disabled={!roleName}
            >
              {isEditMode ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
