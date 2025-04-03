'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { use } from 'react';
import { Loader2, Plus, Search } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  action: string;
  scope: string | null;
  resource: {
    id: string;
    name: string;
    path: string;
  };
}

interface EntityRole {
  id: string;
  name: string;
  description: string | null;
  entityRolePermissions: {
    permission: Permission;
  }[];
}

interface Entity {
  id: string;
  name: string;
  entityType: {
    id: string;
    name: string;
  };
}

export default function EntityPermissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [roles, setRoles] = useState<EntityRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedResource, setSelectedResource] = useState<string>('all');

  const fetchEntity = useCallback(async () => {
    try {
      const response = await fetch(`/api/entities/${resolvedParams.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch entity');
      }

      const data = await response.json();
      setEntity(data);
    } catch (error) {
      console.error('Error fetching entity:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch entity details',
        variant: 'destructive',
      });
    }
  }, [resolvedParams.id, toast]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await fetch(`/api/entities/${resolvedParams.id}/roles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }

      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch entity roles',
        variant: 'destructive',
      });
    }
  }, [resolvedParams.id, toast]);

  const fetchPermissions = useCallback(async () => {
    try {
      const response = await fetch('/api/permissions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }

      const data = await response.json();
      setPermissions(data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch permissions',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchEntity(),
        fetchRoles(),
        fetchPermissions(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchEntity, fetchRoles, fetchPermissions]);

  const filteredPermissions = permissions.filter((permission) => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || roles.find(role => 
      role.entityRolePermissions.some(erp => erp.permission.id === permission.id)
    );
    const matchesResource = selectedResource === 'all' || permission.resource.path === selectedResource;
    return matchesSearch && matchesRole && matchesResource;
  });

  const uniqueResources = Array.from(new Set(permissions.map(p => p.resource.path)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div>Entity not found</div>
          <Button
            onClick={() => router.push('/admin/entities')}
            className="mt-4"
          >
            Back to Entities
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Permissions Management</h1>
          <p className="text-muted-foreground">
            Manage permissions for {entity.name} ({entity.entityType.name})
          </p>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/entities/${resolvedParams.id}`)}
          >
            Back to Entity
          </Button>
          <Button
            onClick={() => router.push(`/admin/entities/${resolvedParams.id}/roles/new`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permissions Overview</CardTitle>
          <CardDescription>
            View and manage permissions for different roles in this entity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search permissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select
                value={selectedRole}
                onValueChange={setSelectedRole}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedResource}
                onValueChange={setSelectedResource}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {uniqueResources.map((resource) => (
                    <SelectItem key={resource} value={resource}>
                      {resource}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permission</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-medium">
                      {permission.name}
                    </TableCell>
                    <TableCell>{permission.action}</TableCell>
                    <TableCell>{permission.resource.name}</TableCell>
                    <TableCell>{permission.scope || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {roles
                          .filter((role) =>
                            role.entityRolePermissions.some(
                              (erp) => erp.permission.id === permission.id
                            )
                          )
                          .map((role) => (
                            <span
                              key={role.id}
                              className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                            >
                              {role.name}
                            </span>
                          ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPermissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No permissions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 