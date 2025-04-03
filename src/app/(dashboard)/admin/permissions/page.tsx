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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import { Loader2, Plus, Search, RefreshCw } from 'lucide-react';

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
  entity: {
    id: string;
    name: string;
    entityType: {
      id: string;
      name: string;
    };
  };
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

interface User {
  id: string;
  username: string;
  email: string;
  entityMembers: {
    id: string;
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
      description: string | null;
    };
  }[];
}

export default function PermissionsAndRolesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<EntityRole[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('permissions');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [selectedResource, setSelectedResource] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [deletingPermission, setDeletingPermission] = useState<string | null>(null);

  const fetchWithRetry = useCallback(async (url: string, options: RequestInit, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) {
          return response;
        }
        
        // If we get a 401 or 403, don't retry
        if (response.status === 401 || response.status === 403) {
          return response;
        }
        
        console.log(`Retry ${i + 1}/${retries} for ${url}`);
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      } catch (error) {
        if (i === retries - 1) {
          throw error;
        }
        console.log(`Retry ${i + 1}/${retries} for ${url} due to error:`, error);
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
    
    // This should never be reached, but TypeScript needs it
    throw new Error(`Failed to fetch ${url} after ${retries} retries`);
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      console.log('Fetching permissions...');
      const response = await fetchWithRetry('/api/permissions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(`Failed to fetch permissions: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('Permissions data:', data);
      setPermissions(data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch permissions',
        variant: 'destructive',
      });
    }
  }, [toast, fetchWithRetry]);

  const fetchRoles = useCallback(async () => {
    try {
      console.log('Fetching roles...');
      const response = await fetchWithRetry('/api/roles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(`Failed to fetch roles: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('Roles data:', data);
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch roles',
        variant: 'destructive',
      });
    }
  }, [toast, fetchWithRetry]);

  const fetchEntities = useCallback(async () => {
    try {
      console.log('Fetching entities...');
      const response = await fetchWithRetry('/api/entities', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(`Failed to fetch entities: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('Entities data:', data);
      setEntities(data);
    } catch (error) {
      console.error('Error fetching entities:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch entities',
        variant: 'destructive',
      });
    }
  }, [toast, fetchWithRetry]);

  const fetchUsers = useCallback(async () => {
    try {
      console.log('Fetching users...');
      const response = await fetchWithRetry('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(`Failed to fetch users: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('Users data:', data);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch users',
        variant: 'destructive',
      });
    }
  }, [toast, fetchWithRetry]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchPermissions(),
        fetchRoles(),
        fetchEntities(),
        fetchUsers(),
      ]);
      toast({
        title: 'Success',
        description: 'Data refreshed successfully',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPermissions, fetchRoles, fetchEntities, fetchUsers, toast]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPermissions(),
        fetchRoles(),
        fetchEntities(),
        fetchUsers(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchPermissions, fetchRoles, fetchEntities, fetchUsers]);

  const filteredPermissions = permissions.filter((permission) => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResource = selectedResource === 'all' || 
      (permission.resource && permission.resource.path === selectedResource);
    return matchesSearch && matchesResource;
  });

  const filteredRoles = roles.filter((role) => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesEntity = selectedEntity === 'all' || role.entity.id === selectedEntity;
    const matchesEntityType = selectedEntityType === 'all' || role.entity.entityType.id === selectedEntityType;
    return matchesSearch && matchesEntity && matchesEntityType;
  });

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEntity = selectedEntity === 'all' || 
      user.entityMembers.some(member => member.entity.id === selectedEntity);
    const matchesEntityType = selectedEntityType === 'all' || 
      user.entityMembers.some(member => member.entity.entityType.id === selectedEntityType);
    return matchesSearch && matchesEntity && matchesEntityType;
  });

  const uniqueResources = Array.from(new Set(
    permissions
      .filter(p => p.resource)
      .map(p => p.resource.path)
  ));
  const uniqueEntityTypes = Array.from(new Set(entities.map(e => e.entityType.id)));

  const handleDeletePermission = async (permissionId: string) => {
    if (!confirm('Are you sure you want to delete this permission? This action cannot be undone.')) {
      return;
    }

    setDeletingPermission(permissionId);
    try {
      const response = await fetch(`/api/permissions?id=${permissionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete permission');
      }

      toast({
        title: 'Success',
        description: 'Permission deleted successfully',
      });

      // Refresh the permissions list
      await fetchPermissions();
    } catch (error) {
      console.error('Error deleting permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete permission',
        variant: 'destructive',
      });
    } finally {
      setDeletingPermission(null);
    }
  };

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

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Permissions & Roles</h1>
          <p className="text-muted-foreground">
            Manage system-wide permissions and roles
          </p>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button
            onClick={() => router.push('/admin/permissions/new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Permission
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>System Permissions</CardTitle>
              <CardDescription>
                View and manage all available permissions in the system
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
                      <TableHead>Used By</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPermissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell className="font-medium">
                          {permission.name}
                        </TableCell>
                        <TableCell>{permission.action}</TableCell>
                        <TableCell>{permission.resource?.name || 'N/A'}</TableCell>
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
                                  {role.name} ({role.entity.name})
                                </span>
                              ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/permissions/${permission.id}/edit`)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePermission(permission.id)}
                              disabled={deletingPermission === permission.id}
                            >
                              {deletingPermission === permission.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Delete'
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredPermissions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No permissions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Entity Roles</CardTitle>
              <CardDescription>
                View and manage roles across all entities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search roles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select
                    value={selectedEntity}
                    onValueChange={setSelectedEntity}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by entity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Entities</SelectItem>
                      {entities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedEntityType}
                    onValueChange={setSelectedEntityType}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Entity Types</SelectItem>
                      {uniqueEntityTypes.map((typeId) => {
                        const type = entities.find(e => e.entityType.id === typeId)?.entityType;
                        return (
                          <SelectItem key={typeId} value={typeId}>
                            {type?.name || typeId}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Entity Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Members</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">
                          {role.name}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            onClick={() => router.push(`/admin/entities/${role.entity.id}`)}
                          >
                            {role.entity.name}
                          </Button>
                        </TableCell>
                        <TableCell>{role.entity.entityType.name}</TableCell>
                        <TableCell>{role.description || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {role.entityRolePermissions.map((erp) => (
                              <span
                                key={erp.permission.id}
                                className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                              >
                                {erp.permission.name}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {users
                              .filter((user) =>
                                user.entityMembers.some(
                                  (member) => member.entityRole.id === role.id
                                )
                              )
                              .map((user) => (
                                <span
                                  key={user.id}
                                  className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                                >
                                  {user.username}
                                </span>
                              ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredRoles.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No roles found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Roles</CardTitle>
              <CardDescription>
                View and manage user roles across all entities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select
                    value={selectedEntity}
                    onValueChange={setSelectedEntity}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by entity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Entities</SelectItem>
                      {entities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedEntityType}
                    onValueChange={setSelectedEntityType}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Entity Types</SelectItem>
                      {uniqueEntityTypes.map((typeId) => {
                        const type = entities.find(e => e.entityType.id === typeId)?.entityType;
                        return (
                          <SelectItem key={typeId} value={typeId}>
                            {type?.name || typeId}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Permissions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.username}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.entityMembers.map((member) => (
                              <Button
                                key={member.id}
                                variant="link"
                                onClick={() => router.push(`/admin/entities/${member.entity.id}`)}
                                className="px-2 py-1 text-xs"
                              >
                                {member.entity.name}
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.entityMembers.map((member) => (
                              <span
                                key={member.id}
                                className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                              >
                                {member.entityRole.name}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.entityMembers.map((member) => {
                              const role = roles.find(r => r.id === member.entityRole.id);
                              return role?.entityRolePermissions.map((erp) => (
                                <span
                                  key={erp.permission.id}
                                  className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                                >
                                  {erp.permission.name}
                                </span>
                              ));
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 