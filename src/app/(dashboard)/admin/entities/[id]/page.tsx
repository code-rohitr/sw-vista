'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import { Loader2 } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface EntityType {
  id: string;
  name: string;
}

interface Entity {
  id: string;
  name: string;
  description: string | null;
  entityType: {
    id: string;
    name: string;
  };
  parent: {
    id: string;
    name: string;
  } | null;
  children: {
    id: string;
    name: string;
  }[];
  created_at: string;
  updated_at: string;
}

interface EntityRole {
  id: string;
  name: string;
  description: string | null;
  template: {
    id: string;
    name: string;
  };
  entityRolePermissions: {
    permission: {
      id: string;
      name: string;
      action: string;
      scope: string | null;
    };
    resource: {
      id: string;
      name: string;
      path: string;
    };
  }[];
}

interface EntityMember {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  entityRole: {
    id: string;
    name: string;
    description: string | null;
  };
}

interface AuditLog {
  id: string;
  user: {
    id: string;
    username: string;
  };
  action: string;
  details: string;
  created_at: string;
}

export default function EntityDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [roles, setRoles] = useState<EntityRole[]>([]);
  const [members, setMembers] = useState<EntityMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

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

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch(`/api/entities/${resolvedParams.id}/members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }

      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch entity members',
        variant: 'destructive',
      });
    }
  }, [resolvedParams.id, toast]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const response = await fetch(`/api/audit-logs?entityId=${resolvedParams.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setAuditLogs(data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch audit logs',
        variant: 'destructive',
      });
    }
  }, [resolvedParams.id, toast]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchEntity(),
        fetchRoles(),
        fetchMembers(),
        fetchAuditLogs(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchEntity, fetchRoles, fetchMembers, fetchAuditLogs]);

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
          <h1 className="text-2xl font-bold">{entity.name}</h1>
          <p className="text-muted-foreground">{entity.description}</p>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/entities/${resolvedParams.id}/edit`)}
          >
            Edit Entity
          </Button>
          <Button
            onClick={() => router.push(`/admin/entities/${resolvedParams.id}/members/add`)}
          >
            Add Member
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Entity Details</CardTitle>
              <CardDescription>Basic information about the entity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <h3 className="font-medium">Entity Type</h3>
                  <p>{entity.entityType.name}</p>
                </div>
                <div>
                  <h3 className="font-medium">Parent Entity</h3>
                  <p>{entity.parent?.name || 'None'}</p>
                </div>
                <div>
                  <h3 className="font-medium">Child Entities</h3>
                  {entity.children.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {entity.children.map((child) => (
                        <li key={child.id}>
                          <Button
                            variant="link"
                            onClick={() => router.push(`/admin/entities/${child.id}`)}
                          >
                            {child.name}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No child entities</p>
                  )}
                </div>
                <div>
                  <h3 className="font-medium">Created At</h3>
                  <p>{new Date(entity.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="font-medium">Last Updated</h3>
                  <p>{new Date(entity.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Entity Members</CardTitle>
              <CardDescription>Users who are members of this entity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium">{member.user.username}</h3>
                      <p className="text-sm text-muted-foreground">
                        {member.user.email}
                      </p>
                      <p className="text-sm">Role: {member.entityRole.name}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => router.push(`/admin/entities/${resolvedParams.id}/members/${member.user.id}`)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-center text-muted-foreground">
                    No members found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Entity Roles</CardTitle>
              <CardDescription>Roles defined for this entity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{role.name}</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/entities/${resolvedParams.id}/roles/${role.id}`)}
                      >
                        Edit
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {role.description || 'No description'}
                    </p>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Permissions:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {role.entityRolePermissions.map((permission) => (
                          <div
                            key={permission.permission.id}
                            className="text-sm p-2 bg-muted rounded"
                          >
                            {permission.permission.name} on{' '}
                            {permission.resource.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {roles.length === 0 && (
                  <p className="text-center text-muted-foreground">
                    No roles defined
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>History of actions performed on this entity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">{log.user.username}</span>
                        <span className="text-muted-foreground mx-2">•</span>
                        <span className="text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {log.details}
                    </p>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <p className="text-center text-muted-foreground">
                    No audit logs found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 