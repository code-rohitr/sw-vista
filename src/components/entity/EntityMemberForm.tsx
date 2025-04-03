'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Entity {
  id: number;
  name: string;
  entity_type_id: number;
}

interface User {
  id: number;
  username: string;
  email: string;
}

interface EntityRole {
  id: number;
  name: string;
  description?: string;
  template_id?: number;
  template?: {
    id: number;
    name: string;
    permissions: string;
  };
}

interface EntityMemberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  initialData?: {
    entity_id: number;
    user_id: number;
    entity_role_id: number;
  } | null;
}

export function EntityMemberForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: EntityMemberFormProps) {
  const { hasPermission } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [entityRoles, setEntityRoles] = useState<EntityRole[]>([]);
  const [formData, setFormData] = useState({
    entity_id: '',
    user_id: '',
    entity_role_id: '',
  });

  useEffect(() => {
    if (open) {
      fetchEntities();
      fetchUsers();
      if (initialData) {
        setFormData({
          entity_id: initialData.entity_id.toString(),
          user_id: initialData.user_id.toString(),
          entity_role_id: initialData.entity_role_id.toString(),
        });
        fetchEntityRoles(initialData.entity_id);
      } else {
        setFormData({
          entity_id: '',
          user_id: '',
          entity_role_id: '',
        });
      }
    }
  }, [open, initialData]);

  const fetchEntities = async () => {
    try {
      const response = await fetch('/api/entities');
      if (!response.ok) {
        throw new Error('Failed to fetch entities');
      }
      const data = await response.json();
      setEntities(data);
    } catch (error) {
      console.error('Error fetching entities:', error);
      toast.error('Failed to load entities');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const fetchEntityRoles = async (entityId: number) => {
    try {
      const response = await fetch(`/api/entities/${entityId}/roles`);
      if (!response.ok) {
        throw new Error('Failed to fetch entity roles');
      }
      const data = await response.json();
      setEntityRoles(data);
    } catch (error) {
      console.error('Error fetching entity roles:', error);
      toast.error('Failed to load entity roles');
    }
  };

  const handleEntityChange = async (entityId: string) => {
    setFormData((prev) => ({
      ...prev,
      entity_id: entityId,
      entity_role_id: '',
    }));
    if (entityId) {
      await fetchEntityRoles(parseInt(entityId));
    } else {
      setEntityRoles([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        entity_id: parseInt(formData.entity_id),
        user_id: parseInt(formData.user_id),
        entity_role_id: parseInt(formData.entity_role_id),
      };

      onSubmit(data);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to save entity member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Entity Member' : 'Add Entity Member'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entity_id">Entity</Label>
            <Select
              value={formData.entity_id}
              onValueChange={handleEntityChange}
            >
              <SelectTrigger disabled={isLoading}>
                <SelectValue placeholder="Select entity" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id.toString()}>
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!formData.entity_id && (
              <p className="text-sm text-red-500">Entity is required</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="user_id">User</Label>
            <Select
              value={formData.user_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, user_id: value }))
              }
            >
              <SelectTrigger disabled={isLoading}>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.username} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!formData.user_id && (
              <p className="text-sm text-red-500">User is required</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="entity_role_id">Role</Label>
            <Select
              value={formData.entity_role_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, entity_role_id: value }))
              }
            >
              <SelectTrigger disabled={isLoading || !formData.entity_id}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {entityRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.name}
                    {role.template && ` (Template: ${role.template.name})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!formData.entity_role_id && (
              <p className="text-sm text-red-500">Role is required</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : initialData ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}