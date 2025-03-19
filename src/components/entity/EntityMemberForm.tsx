'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface EntityMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  isEditMode?: boolean;
}

export default function EntityMemberForm({ isOpen, onClose, onSubmit, initialData, isEditMode = false }: EntityMemberFormProps) {
  const [entityId, setEntityId] = useState<number | ''>('');
  const [userId, setUserId] = useState<number | ''>('');
  const [entityRoleId, setEntityRoleId] = useState<number | ''>('');
  const [entities, setEntities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [entityRoles, setEntityRoles] = useState<any[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    // Reset form when dialog opens/closes or initialData changes
    if (isOpen) {
      if (initialData) {
        setEntityId(initialData.entity_id || '');
        setUserId(initialData.user_id || '');
        setEntityRoleId(initialData.entity_role_id || '');
      } else {
        setEntityId('');
        setUserId('');
        setEntityRoleId('');
        setSelectedEntityType(null);
      }
      
      // Fetch entities and users
      fetchEntities();
      fetchUsers();
      
      // If we have an entity_id, we need to fetch its type to load the appropriate roles
      if (initialData?.entity_id) {
        fetchEntities().then((entitiesData) => {
          if (entitiesData) {
            const entity = entitiesData.find((e: any) => e.id === initialData.entity_id);
            if (entity) {
              setSelectedEntityType(entity.entity_type_id);
              fetchEntityRoles(entity.entity_type_id);
            }
          }
        });
      }
    }
  }, [isOpen, initialData]);

  const fetchEntities = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/entities', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch entities');
      const data = await response.json();
      setEntities(data);
      return data;
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
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

  const handleSubmit = async () => {
    if (!entityId || !userId || !entityRoleId) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit({
        entity_id: entityId,
        user_id: userId,
        entity_role_id: entityRoleId
      });
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Entity Member' : 'Add Entity Member'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update entity member information.'
              : 'Assign a user to an entity with a specific role.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="entity">Entity</Label>
            <select
              id="entity"
              value={entityId}
              onChange={handleEntityChange}
              className="w-full p-2 border rounded"
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
          
          <div className="space-y-2">
            <Label htmlFor="user">User</Label>
            <select
              id="user"
              value={userId}
              onChange={(e) => setUserId(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full p-2 border rounded"
              disabled={isEditMode} // Typically can't change user in edit mode
            >
              <option value="">Select User</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username || user.email || `User ${user.id}`}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="entityRole">Role</Label>
            <select
              id="entityRole"
              value={entityRoleId}
              onChange={(e) => setEntityRoleId(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full p-2 border rounded"
              disabled={!selectedEntityType} // Disable until an entity is selected
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
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!entityId || !userId || !entityRoleId || isLoading}>
            {isEditMode ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}