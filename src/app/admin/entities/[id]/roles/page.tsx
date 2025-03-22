'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useParams } from 'next/navigation';

export default function EntityRolesPage() {
  const params = useParams();
  const entityId = params.id as string;
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  const { toast } = useToast();

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('Not authenticated');
  
        // Fetch all required data
        const [rolesRes, permissionsRes, resourcesRes] = await Promise.all([
          fetch(`/api/entity-roles?entityId=${entityId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/permissions', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/resources', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        if (!rolesRes.ok) throw new Error('Failed to fetch roles');
        if (!permissionsRes.ok) throw new Error('Failed to fetch permissions');
        if (!resourcesRes.ok) throw new Error('Failed to fetch resources');

        const [rolesData, permissionsData, resourcesData] = await Promise.all([
          rolesRes.json(),
          permissionsRes.json(),
          resourcesRes.json()
        ]);

        setRoles(rolesData);
        setPermissions(permissionsData);
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
  }, [entityId, toast]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedPermissions([]);
    setSelectedRole(null);
    setIsEditMode(false);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };
  
  const handleOpenDialog = (role?: any) => {
    resetForm();
    
    if (role) {
      setSelectedRole(role);
      setName(role.name);
      setDescription(role.description || '');
      setSelectedPermissions(role.permissions?.map((p: any) => p.id.toString()) || []);
      setIsEditMode(true);
    }
    
    setIsDialogOpen(true);
  };
  
  const handleCreateRole = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/entity-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          entity_id: parseInt(entityId),
          permissions: selectedPermissions.map(id => parseInt(id))
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create role');
      }

      // Update roles list
      setRoles([...roles, data]);
      
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

      const response = await fetch(`/api/entity-roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          permissions: selectedPermissions.map(id => parseInt(id))
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update role');
      }

      // Update roles list
      setRoles(roles.map(role => role.id === selectedRole.id ? data : role));
      
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

      const response = await fetch(`/api/entity-roles/${roleId}`, {
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
        <h2 className="text-2xl font-bold">Entity Roles</h2>
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
                <TableHead>Permissions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.id}</TableCell>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    {role.permissions?.map((p: any) => p.name).join(', ') || 'No permissions'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(role)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteRole(role.id)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Role' : 'Create New Role'}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update role information and permissions.'
                : 'Fill in the details to create a new role.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter role name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter role description"
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              {permissions.map((permission) => (
                <div key={permission.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`permission-${permission.id}`}
                    checked={selectedPermissions.includes(permission.id.toString())}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPermissions([...selectedPermissions, permission.id.toString()]);
                      } else {
                        setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id.toString()));
                      }
                    }}
                  />
                  <Label htmlFor={`permission-${permission.id}`}>{permission.name}</Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={isEditMode ? handleUpdateRole : handleCreateRole}>
              {isEditMode ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
