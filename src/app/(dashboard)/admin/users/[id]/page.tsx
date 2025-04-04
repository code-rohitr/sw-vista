'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  isSystemAdmin: boolean;
  entityMembers: {
    id: string;
    entity_id: string;
    entity_role_id: string;
    entity: {
      id: string;
      name: string;
      entityType: {
        id: string;
        name: string;
      };
    };
    entityRole: {
      id: string;
      name: string;
    };
  }[];
  created_at: string;
}

interface EntityType {
  id: string;
  name: string;
}

interface Entity {
  id: string;
  name: string;
  entityTypeId: string;
}

interface EntityRole {
  id: string;
  name: string;
}

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [roles, setRoles] = useState<EntityRole[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      console.log('Fetching user with ID:', resolvedParams.id);
      const response = await fetch(`/api/users/${resolvedParams.id}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      const data = await response.json();
      console.log('User data received:', data);
      setUser(data);

      if (data.entityMembers && data.entityMembers.length > 0) {
        const membership = data.entityMembers[0];
        setSelectedEntityType(membership.entity.entityType.id);
        setSelectedEntity(membership.entity_id);
        setSelectedRole(membership.entity_role_id);
        await fetchEntities(membership.entity.entityType.id);
        await fetchRoles(membership.entity_id);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch user details. Please try again.',
        variant: 'destructive',
      });
    }
  }, [resolvedParams.id, toast]);

  const fetchEntityTypes = useCallback(async () => {
    try {
      const response = await fetch('/api/entity-types', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch entity types');
      }
      const data = await response.json();
      console.log('Entity types received:', data);
      setEntityTypes(data);
    } catch (error) {
      console.error('Error fetching entity types:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch entity types. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchEntities = useCallback(async (entityTypeId: string) => {
    try {
      const response = await fetch(`/api/entities?entityTypeId=${entityTypeId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch entities');
      }
      const data = await response.json();
      console.log('Entities received:', data);
      setEntities(data);
    } catch (error) {
      console.error('Error fetching entities:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch entities. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchRoles = useCallback(async (entityId: string) => {
    try {
      const response = await fetch(`/api/entities/${entityId}/roles`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      const data = await response.json();
      console.log('Roles received:', data);
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch roles. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchUser(), fetchEntityTypes()]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchUser, fetchEntityTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      console.log('Cannot submit: user is missing');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: user.username,
          email: user.email,
          entity_id: selectedEntity,
          entity_role_id: selectedRole,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      toast({
        title: 'Success',
        description: 'User updated successfully',
      });

      router.push('/admin/users');
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <div>Loading user details...</div>
        </div>
      </div>
    );
  }

  console.log('Current user state:', user);
  console.log('Current entity types:', entityTypes);
  console.log('Current entities:', entities);
  console.log('Current roles:', roles);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-muted-foreground">User not found</div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/admin/users')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/users')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Edit User</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div>
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <Input
                  id="username"
                  value={user.username}
                  onChange={(e) =>
                    setUser({ ...user, username: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="entityType" className="text-sm font-medium">
                  Entity Type
                </label>
                <Select
                  value={selectedEntityType}
                  onValueChange={(value) => {
                    setSelectedEntityType(value);
                    fetchEntities(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    {entityTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="entity" className="text-sm font-medium">
                  Entity
                </label>
                <Select
                  value={selectedEntity}
                  onValueChange={(value) => {
                    setSelectedEntity(value);
                    fetchRoles(value);
                  }}
                  disabled={!selectedEntityType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="role" className="text-sm font-medium">
                  Role
                </label>
                <Select
                  value={selectedRole}
                  onValueChange={setSelectedRole}
                  disabled={!selectedEntity}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 