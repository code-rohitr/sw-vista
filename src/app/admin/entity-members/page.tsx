'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function EntityMemberManagementPage() {
  const [entityMembers, setEntityMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEntityMember, setSelectedEntityMember] = useState<any>(null);
  
  const [entities, setEntities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [entityRoles, setEntityRoles] = useState<any[]>([]);
  const [entityId, setEntityId] = useState<number | ''>('');
  const [userId, setUserId] = useState<number | ''>('');
  const [entityRoleId, setEntityRoleId] = useState<number | ''>('');
  const [selectedEntityType, setSelectedEntityType] = useState<number | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('Not authenticated');
  
        // Fetch entity members
        const membersResponse = await fetch('/api/entity-members', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!membersResponse.ok) throw new Error('Failed to fetch entity members');
        const membersData = await membersResponse.json();
        setEntityMembers(membersData);
  
        // Fetch entities
        const entitiesResponse = await fetch('/api/entities', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!entitiesResponse.ok) throw new Error('Failed to fetch entities');
        const entitiesData = await entitiesResponse.json();
        setEntities(entitiesData);
  
        // Fetch users
        const usersResponse = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!usersResponse.ok) throw new Error('Failed to fetch users');
        const usersData = await usersResponse.json();
        setUsers(usersData);
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
  
  const fetchEntityRoles = async (entityTypeId: number) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
  
      const response = await fetch(`/api/entity-roles?entity_type_id=${entityTypeId}`, {
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
  
  const handleEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : '';
    setEntityId(value);
    
    if (value !== '') {
      const entity = entities.find(e => e.id === value);
      if (entity) {
        setSelectedEntityType(entity.entity_type_id);
        fetchEntityRoles(entity.entity_type_id);
      }
    } else {
      setSelectedEntityType(null);
      setEntityRoles([]);
    }
    
    setEntityRoleId('');
  };
  
  const resetForm = () => {
    setEntityId('');
    setUserId('');
    setEntityRoleId('');
    setSelectedEntityType(null);
    setSelectedEntityMember(null);
    setIsEditMode(false);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };
  
  const handleOpenDialog = (entityMember?: any) => {
    resetForm();
    
    if (entityMember) {
      setSelectedEntityMember(entityMember);
      setEntityId(entityMember.entity_id);
      setUserId(entityMember.user_id);
      setEntityRoleId(entityMember.entity_role_id);
      
      // Fetch entity roles for the entity's type
      const entity = entities.find(e => e.id === entityMember.entity_id);
      if (entity) {
        setSelectedEntityType(entity.entity_type_id);
        fetchEntityRoles(entity.entity_type_id);
      }
      
      setIsEditMode(true);
    }
    
    setIsDialogOpen(true);
  };
  
  const handleCreateEntityMember = async () => {
    try {
      if (!entityId || !userId || !entityRoleId) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }
      
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
  
      const response = await fetch('/api/entity-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          entity_id: entityId,
          user_id: userId,
          entity_role_id: entityRoleId
        })
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create entity member');
      }
  
      // Update entity members list
      setEntityMembers([...entityMembers, data]);
      
      toast({
        title: 'Success',
        description: 'Entity member created successfully',
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
  
  const handleUpdateEntityMember = async () => {
    try {
      if (!entityId || !userId || !entityRoleId) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }
      
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
  
      const updateData = {
        entity_id: entityId,
        user_id: userId,
        entity_role_id: entityRoleId
      };
  
      const response = await fetch(`/api/entity-members/${selectedEntityMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update entity member');
      }
  
      // Update entity members list
      setEntityMembers(entityMembers.map(member => 
        member.id === selectedEntityMember.id ? data : member
      ));
      
      toast({
        title: 'Success',
        description: 'Entity member updated successfully',
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

  const handleDeleteEntityMember = async (entityMemberId: number) => {
    if (!confirm('Are you sure you want to delete this entity member?')) return;
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/entity-members/${entityMemberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete entity member');
      }

      // Update entity members list
      setEntityMembers(entityMembers.filter(member => member.id !== entityMemberId));
      
      toast({
        title: 'Success',
        description: 'Entity member deleted successfully',
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

  if (isLoading && entityMembers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">Loading entity members...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Entity Member Management</h2>
        <Button onClick={() => handleOpenDialog()}>Add New Member</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entity Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entityMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.id}</TableCell>
                  <TableCell>{member.entity?.name || member.entity_id}</TableCell>
                  <TableCell>{member.user?.username || member.user_id}</TableCell>
                  <TableCell>{member.entity_role?.name || member.entity_role_id}</TableCell>
                  <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(member)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteEntityMember(member.id)}>
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

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Entity Member' : 'Add Entity Member'}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update entity member information.'
                : 'Assign a user to an entity with a specific role.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="entity" className="text-right">
                Entity
              </Label>
              <select
                id="entity"
                value={entityId}
                onChange={handleEntityChange}
                className="col-span-3 p-2 border rounded"
                disabled={isEditMode} // Typically can't change entity in edit mode
              >
                <option value="">Select Entity</option>
                {entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user" className="text-right">
                User
              </Label>
              <select
                id="user"
                value={userId}
                onChange={(e) => setUserId(e.target.value ? parseInt(e.target.value) : '')}
                className="col-span-3 p-2 border rounded"
                disabled={isEditMode} // Typically can't change user in edit mode
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="entityRole" className="text-right">
                Role
              </Label>
              <select
                id="entityRole"
                value={entityRoleId}
                onChange={(e) => setEntityRoleId(e.target.value ? parseInt(e.target.value) : '')}
                className="col-span-3 p-2 border rounded"
                disabled={entityId === ''} // Only disable if no entity is selected
              >
                <option value="">Select Role</option>
                {entityRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={isEditMode ? handleUpdateEntityMember : handleCreateEntityMember}
              disabled={!entityId || !userId || !entityRoleId || isLoading}
            >
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}