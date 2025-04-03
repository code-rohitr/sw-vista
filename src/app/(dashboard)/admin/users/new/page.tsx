'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface EntityType {
  id: string;
  name: string;
}

interface Entity {
  id: string;
  name: string;
  entityTypeId: string;
}

interface Role {
  id: string;
  name: string;
}

export default function NewUserPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    isSystemAdmin: false,
  });
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const fetchEntityTypes = useCallback(async () => {
    try {
      const response = await fetch('/api/entity-types', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch entity types');
      const data = await response.json();
      setEntityTypes(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch entity types',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchEntities = useCallback(async (entityTypeId: string) => {
    try {
      const response = await fetch(`/api/entities?entityTypeId=${entityTypeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch entities');
      const data = await response.json();
      setEntities(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch entities',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchRoles = useCallback(async (entityId: string) => {
    try {
      const response = await fetch(`/api/entity-roles?entityId=${entityId}&entityTypeId=${selectedEntityType}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch roles',
        variant: 'destructive',
      });
    }
  }, [toast, selectedEntityType]);

  // Fetch entity types on component mount
  useEffect(() => {
    fetchEntityTypes();
  }, [fetchEntityTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          entityId: selectedEntity,
          roleId: selectedRole,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      toast({
        title: 'Success',
        description: 'User created successfully',
      });

      router.push('/admin/users');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create New User</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isSystemAdmin"
                  checked={formData.isSystemAdmin}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isSystemAdmin: checked as boolean })
                  }
                />
                <Label htmlFor="isSystemAdmin">System Administrator</Label>
              </div>

              {!formData.isSystemAdmin && (
                <>
                  <div className="space-y-2">
                    <Label>Entity Type</Label>
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

                  <div className="space-y-2">
                    <Label>Entity</Label>
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

                  <div className="space-y-2">
                    <Label>Role</Label>
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
                </>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 