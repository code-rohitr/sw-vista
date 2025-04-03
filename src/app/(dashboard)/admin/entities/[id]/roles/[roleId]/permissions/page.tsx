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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { use } from 'react';
import { Loader2, Save } from 'lucide-react';

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

export default function RolePermissionsPage({ params }: { params: Promise<{ id: string; roleId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [role, setRole] = useState<EntityRole | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const fetchRole = useCallback(async () => {
    try {
      const response = await fetch(`/api/entities/${resolvedParams.id}/roles/${resolvedParams.roleId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch role');
      }

      const data = await response.json();
      setRole(data);
      setSelectedPermissions(new Set(data.entityRolePermissions.map(erp => erp.permission.id)));
    } catch (error) {
      console.error('Error fetching role:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch role details',
        variant: 'destructive',
      });
    }
  }, [resolvedParams.id, resolvedParams.roleId, toast]);

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
        fetchRole(),
        fetchPermissions(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchEntity, fetchRole, fetchPermissions]);

  const handleSave = async () => {
    if (!role) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/entities/${resolvedParams.id}/roles/${resolvedParams.roleId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          permissionIds: Array.from(selectedPermissions),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role permissions');
      }

      toast({
        title: 'Success',
        description: 'Role permissions updated successfully',
      });

      router.push(`/admin/entities/${resolvedParams.id}/permissions`);
    } catch (error) {
      console.error('Error updating role permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to update role permissions',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredPermissions = permissions.filter((permission) =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.resource.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (!entity || !role) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div>Entity or role not found</div>
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
          <h1 className="text-2xl font-bold">Role Permissions</h1>
          <p className="text-muted-foreground">
            Manage permissions for {role.name} in {entity.name}
          </p>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/entities/${resolvedParams.id}/permissions`)}
          >
            Back to Permissions
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Permissions</CardTitle>
          <CardDescription>
            Select the permissions that should be granted to this role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Permission</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Scope</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedPermissions.has(permission.id)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedPermissions);
                          if (checked) {
                            newSelected.add(permission.id);
                          } else {
                            newSelected.delete(permission.id);
                          }
                          setSelectedPermissions(newSelected);
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {permission.name}
                    </TableCell>
                    <TableCell>{permission.action}</TableCell>
                    <TableCell>{permission.resource.name}</TableCell>
                    <TableCell>{permission.scope || 'N/A'}</TableCell>
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