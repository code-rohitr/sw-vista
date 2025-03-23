'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function EntityRoleManagementPage() {
  // Entity roles state
  const [entityRoles, setEntityRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEntityRole, setSelectedEntityRole] = useState<any>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedPermissionResources, setSelectedPermissionResources] = useState<Record<number, number[]>>({});
  const [permissions, setPermissions] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  
  const { toast } = useToast();

  // Add entityTypes state
  const [entityTypes, setEntityTypes] = useState<any[]>([]);
  const [entityTypeId, setEntityTypeId] = useState<number | ''>('');
  
  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('Not authenticated');
  
        // Fetch all required data in parallel
        const [rolesRes, typesRes, permissionsRes, resourcesRes] = await Promise.all([
          fetch('/api/entity-roles', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/entity-types', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/permissions', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/resources', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        if (!rolesRes.ok) throw new Error('Failed to fetch entity roles');
        if (!typesRes.ok) throw new Error('Failed to fetch entity types');
        if (!permissionsRes.ok) throw new Error('Failed to fetch permissions');
        if (!resourcesRes.ok) throw new Error('Failed to fetch resources');

        const [rolesData, typesData, permissionsData, resourcesData] = await Promise.all([
          rolesRes.json(),
          typesRes.json(),
          permissionsRes.json(),
          resourcesRes.json()
        ]);

        setEntityRoles(rolesData);
        setEntityTypes(typesData);
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
  }, [toast]);
  
  const resetForm = () => {
    setName('');
    setDescription('');
    setEntityTypeId('');
    setSelectedPermissions([]);
    setSelectedPermissionResources({});
    setSelectedEntityRole(null);
    setIsEditMode(false);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };
  
  const handleOpenDialog = async (entityRole?: any) => {
    resetForm();
    
    if (entityRole) {
      setSelectedEntityRole(entityRole);
      setName(entityRole.name);
      setDescription(entityRole.description || '');
      setEntityTypeId(entityRole.entity_type_id);
      
      // Fetch role permissions with resources
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`/api/entity-role-permissions?entityRoleId=${entityRole.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch role permissions');
        const data = await response.json();
        
        // Set selected permissions and their resources
        const permissionIds = new Set<string>();
        const permissionResources: Record<number, number[]> = {};
        
        data.forEach((rp: any) => {
          permissionIds.add(rp.permission_id.toString());
          if (!permissionResources[rp.permission_id]) {
            permissionResources[rp.permission_id] = [];
          }
          permissionResources[rp.permission_id].push(rp.resource_id);
        });
        
        setSelectedPermissions(Array.from(permissionIds));
        setSelectedPermissionResources(permissionResources);
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to fetch role permissions',
          variant: 'destructive',
        });
      }
      
      setIsEditMode(true);
    }
    
    setIsDialogOpen(true);
  };
  
  const handleCreateEntityRole = async () => {
    try {
      if (!entityTypeId) {
        toast({
          title: 'Error',
          description: 'Please select an entity type',
          variant: 'destructive',
        });
        return;
      }
      
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
  
      // First create the entity role
      const createRoleResponse = await fetch('/api/entity-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          entity_type_id: entityTypeId
        })
      });
  
      const roleData = await createRoleResponse.json();
      
      if (!createRoleResponse.ok) {
        throw new Error(roleData.message || 'Failed to create entity role');
      }

      // Then assign permissions with their resources
      if (selectedPermissions.length > 0) {
        const permissionAssignments = selectedPermissions.flatMap(permissionId => {
          const resourceIds = selectedPermissionResources[parseInt(permissionId)] || [];
          return resourceIds.map(resourceId => ({
            entity_role_id: roleData.id,
            permission_id: parseInt(permissionId),
            resource_id: resourceId
          }));
        });

        await Promise.all(
          permissionAssignments.map(assignment =>
            fetch('/api/entity-role-permissions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(assignment)
            })
          )
        );
      }
  
      // Update entity roles list with the new role data
      setEntityRoles([...entityRoles, roleData]);
      
      toast({
        title: 'Success',
        description: 'Entity role created successfully',
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

  const handleUpdateEntityRole = async () => {
    try {
      if (!entityTypeId) {
        toast({
          title: 'Error',
          description: 'Please select an entity type',
          variant: 'destructive',
        });
        return;
      }
      
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
  
      // First update the entity role
      const updateRoleResponse = await fetch(`/api/entity-roles/${selectedEntityRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          entity_type_id: entityTypeId
        })
      });

      const roleData = await updateRoleResponse.json();
      
      if (!updateRoleResponse.ok) {
        throw new Error(roleData.message || 'Failed to update entity role');
      }

      // Delete existing permissions
      await fetch(`/api/entity-role-permissions?entityRoleId=${selectedEntityRole.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Assign new permissions with their resources
      if (selectedPermissions.length > 0) {
        const permissionAssignments = selectedPermissions.flatMap(permissionId => {
          const resourceIds = selectedPermissionResources[parseInt(permissionId)] || [];
          return resourceIds.map(resourceId => ({
            entity_role_id: selectedEntityRole.id,
            permission_id: parseInt(permissionId),
            resource_id: resourceId
          }));
        });

        await Promise.all(
          permissionAssignments.map(assignment =>
            fetch('/api/entity-role-permissions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(assignment)
            })
          )
        );
      }

      // Update entity roles list
      setEntityRoles(entityRoles.map(role => role.id === selectedEntityRole.id ? roleData : role));
      
      toast({
        title: 'Success',
        description: 'Entity role updated successfully',
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

  const handleDeleteEntityRole = async (entityRoleId: number) => {
    if (!confirm('Are you sure you want to delete this entity role?')) return;
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/entity-roles/${entityRoleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete entity role');
      }

      // Update entity roles list
      setEntityRoles(entityRoles.filter(role => role.id !== entityRoleId));
      
      toast({
        title: 'Success',
        description: 'Entity role deleted successfully',
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

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Entity Role Management</h1>
        <Button onClick={() => handleOpenDialog()}>Create New Role</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entity Roles</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading...</p>}
          
          {!isLoading && entityRoles.length === 0 && (
            <p>No entity roles found. Create one to get started.</p>
          )}
          
          {!isLoading && entityRoles.length > 0 && (
            <Table>
              <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
              </TableHeader>
              <TableBody>
                {entityRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>{role.id}</TableCell>
                    <TableCell>{role.name}</TableCell>
                    <TableCell>{role.description || 'N/A'}</TableCell>
                    <TableCell>{role.entityType?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {role.entityRolePermissions?.map((rp: any) => (
                          <span 
                            key={rp.id}
                            className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs"
                            title={`${rp.permission.name} on ${rp.resource.name}`}
                          >
                            {rp.permission.name} ({rp.resource.name})
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenDialog(role)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteEntityRole(role.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Entity Role' : 'Create Entity Role'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Update the details of this entity role.' 
                : 'Fill in the details to create a new entity role.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="entityType" className="text-right">
                Entity Type
              </Label>
              <select
                id="entityType"
                value={entityTypeId}
                onChange={(e) => setEntityTypeId(e.target.value ? parseInt(e.target.value) : '')}
                className="col-span-3 p-2 border rounded"
              >
                <option value="">Select Entity Type</option>
                {entityTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">Permissions & Resources</Label>
              <div className="col-span-3 space-y-4">
                {permissions.map((permission) => (
                  <div key={permission.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`permission-${permission.id}`}
                        checked={selectedPermissions.includes(permission.id.toString())}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, permission.id.toString()]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id.toString()));
                            // Clear resource selections for this permission
                            const { [permission.id]: _, ...rest } = selectedPermissionResources;
                            setSelectedPermissionResources(rest);
                          }
                        }}
                      />
                      <Label htmlFor={`permission-${permission.id}`}>
                        {permission.name}
                        <span className="text-xs text-gray-500 ml-1">({permission.action})</span>
                      </Label>
                    </div>
                    {selectedPermissions.includes(permission.id.toString()) && (
                      <div className="ml-6 pl-2 border-l-2 border-gray-200">
                        <Label className="text-sm text-gray-500 mb-1">Select Resources:</Label>
                        <div className="space-y-1">
                          {resources.map((resource) => (
                            <div key={resource.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`permission-${permission.id}-resource-${resource.id}`}
                                checked={selectedPermissionResources[permission.id]?.includes(resource.id)}
                                onChange={(e) => {
                                  const currentResources = selectedPermissionResources[permission.id] || [];
                                  if (e.target.checked) {
                                    setSelectedPermissionResources({
                                      ...selectedPermissionResources,
                                      [permission.id]: [...currentResources, resource.id]
                                    });
                                  } else {
                                    setSelectedPermissionResources({
                                      ...selectedPermissionResources,
                                      [permission.id]: currentResources.filter(id => id !== resource.id)
                                    });
                                  }
                                }}
                              />
                              <Label 
                                htmlFor={`permission-${permission.id}-resource-${resource.id}`}
                                className="text-sm"
                              >
                                {resource.name}
                                <span className="text-xs text-gray-500 ml-1">({resource.path})</span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={isEditMode ? handleUpdateEntityRole : handleCreateEntityRole}
              disabled={!name || !entityTypeId || selectedPermissions.some(permId => 
                !selectedPermissionResources[parseInt(permId)] || 
                selectedPermissionResources[parseInt(permId)].length === 0
              )}
            >
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
