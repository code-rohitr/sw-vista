'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import PermissionError from '@/components/PermissionError';

interface Entity {
  id: number;
  name: string;
  description: string;
  entityType: {
    id: number;
    name: string;
  };
}

interface EntityMember {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  entityRole: {
    id: number;
    name: string;
    entityRolePermissions: {
      permission: {
        name: string;
      };
      resource: {
        name: string;
      };
    }[];
  };
}

export default function EntityDetailPage() {
  const { id } = useParams();
  const { user, hasEntityRole } = useAuth();
  const { toast } = useToast();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [members, setMembers] = useState<EntityMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    const fetchEntityData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setError('Authentication required');
          setIsLoading(false);
          return;
        }
        
        // Fetch entity details
        const entityResponse = await fetch(`/api/entities/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (entityResponse.status === 403) {
          setPermissionDenied(true);
          setIsLoading(false);
          return;
        }

        if (!entityResponse.ok) {
          setError(entityResponse.status === 404 ? 'Entity not found' : 'Failed to load entity');
          setIsLoading(false);
          return;
        }

        const entityData = await entityResponse.json();
        setEntity(entityData);

        // Fetch entity members
        const membersResponse = await fetch(`/api/entity-members?entityId=${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!membersResponse.ok) {
          throw new Error('Failed to fetch entity members');
        }

        const membersData = await membersResponse.json();
        setMembers(membersData);
      } catch (error) {
        console.error('Error fetching entity data:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load entity data',
          variant: 'destructive',
        });
        setError('An error occurred while fetching the entity');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchEntityData();
    }
  }, [id, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }
  
  if (permissionDenied) {
    return <PermissionError message="You do not have permission to view this entity" />;
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Error: {error}</div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Entity not found</div>
      </div>
    );
  }

  const isAdmin = hasEntityRole && hasEntityRole(entity.id, 'Admin');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{entity.name}</CardTitle>
          <CardDescription>{entity.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Entity Type:</span> {entity.entityType.name}
            </div>
            {isAdmin && (
              <div className="text-sm text-muted-foreground">
                You have administrative privileges for this entity
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>People with access to this entity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{member.user.username}</div>
                    <div className="text-sm text-muted-foreground">{member.user.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{member.entityRole.name}</div>
                  </div>
                </div>
                {member.entityRole.entityRolePermissions?.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm font-medium mb-1">Permissions:</div>
                    <div className="flex flex-wrap gap-2">
                      {member.entityRole.entityRolePermissions.map((permission, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                        >
                          {permission.permission.name} {permission.resource.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
