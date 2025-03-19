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
  const [entityRoles, setEntityRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEntityRole, setSelectedEntityRole] = useState<any>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const { toast } = useToast();

  // Fetch entity roles on component mount
  useEffect(() => {
    const fetchEntityRoles = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('Not authenticated');
  
        const response = await fetch('/api/entity-roles', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch entity roles');
        const data = await response.json();
        setEntityRoles(data);
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
  
    fetchEntityRoles();
  }, [toast]);

  // Add entityTypes state
  const [entityTypes, setEntityTypes] = useState<any[]>([]);
  const [entityTypeId, setEntityTypeId] = useState<number | ''>('');
  
  // Update useEffect to fetch entity types
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('Not authenticated');
  
        // Fetch entity roles
        const rolesResponse = await fetch('/api/entity-roles', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!rolesResponse.ok) throw new Error('Failed to fetch entity roles');
        const rolesData = await rolesResponse.json();
        setEntityRoles(rolesData);
  
        // Fetch entity types
        const typesResponse = await fetch('/api/entity-types', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!typesResponse.ok) throw new Error('Failed to fetch entity types');
        const typesData = await typesResponse.json();
        setEntityTypes(typesData);
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
  
  // Update resetForm to include entityTypeId
  const resetForm = () => {
    setName('');
    setDescription('');
    setEntityTypeId('');
    setSelectedEntityRole(null);
    setIsEditMode(false);
  };
  
  // Add handleCloseDialog function
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };
  
  // Update handleOpenDialog to set entityTypeId
  const handleOpenDialog = (entityRole?: any) => {
    resetForm();
    
    if (entityRole) {
      setSelectedEntityRole(entityRole);
      setName(entityRole.name);
      setDescription(entityRole.description || '');
      setEntityTypeId(entityRole.entity_type_id);
      setIsEditMode(true);
    }
    
    setIsDialogOpen(true);
  };
  
  // Update handleCreateEntityRole to include entityTypeId
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
  
      const response = await fetch('/api/entity-roles', {
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
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create entity role');
      }
  
      // Update entity roles list
      setEntityRoles([...entityRoles, data]);
      
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
  
      const updateData: any = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      updateData.entity_type_id = entityTypeId;

      const response = await fetch(`/api/entity-roles/${selectedEntityRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update entity role');
      }

      // Update entity roles list
      setEntityRoles(entityRoles.map(role => role.id === selectedEntityRole.id ? data : role));
      
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

  // Add the missing render section
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
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={isEditMode ? handleUpdateEntityRole : handleCreateEntityRole}
              disabled={!name}
            >
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}