'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

function formatDate(date: string | null | undefined) {
  if (!date) return 'N/A';
  try {
    return format(new Date(date), 'PPP');
  } catch (e) {
    return 'Invalid Date';
  }
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // Layout will show skeleton
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">User data not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Username</p>
              <p className="text-lg">{user.username || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-lg">{user.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">User ID</p>
              <p className="font-mono text-sm">{user.id || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">System Role</p>
              <p className="text-lg">
                {user.isSystemAdmin ? (
                  <Badge variant="default">System Administrator</Badge>
                ) : (
                  <Badge variant="outline">Regular User</Badge>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-lg">{formatDate(user.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-lg">{formatDate(user.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {user.entityMembers && user.entityMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Entity Memberships</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {user.entityMembers.map((member, index) => (
                <div key={member.id} className="space-y-4">
                  {index > 0 && <Separator />}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Entity Name</p>
                      <p className="text-lg">{member.entity?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Member ID</p>
                      <p className="font-mono text-sm">{member.id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Entity Description</p>
                      <p className="text-muted-foreground">{member.entity?.description || 'No description available'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Role</p>
                      <div className="space-y-1">
                        <p className="text-lg">{member.entityRole?.name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{member.entityRole?.description || 'No description available'}</p>
                      </div>
                    </div>
                  </div>

                  {member.entityRole?.entityRolePermissions && member.entityRole.entityRolePermissions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Role Permissions</p>
                      <div className="space-y-3">
                        {member.entityRole.entityRolePermissions.map((rolePermission) => (
                          <div key={rolePermission.id} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="capitalize">
                                {rolePermission.permission?.action || 'N/A'}
                              </Badge>
                              <span className="text-muted-foreground">on</span>
                              <Badge variant="outline" className="capitalize">
                                {rolePermission.permission?.scope || 'N/A'}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground pl-4">
                              • {rolePermission.permission?.description || 'No description available'}
                            </div>
                            {rolePermission.resource && (
                              <div className="text-xs text-muted-foreground pl-4">
                                Resource: {rolePermission.resource.name} ({rolePermission.resource.path})
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    <p>Member since: {formatDate(member.created_at)}</p>
                    <p>Last updated: {formatDate(member.updated_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(!user.entityMembers || user.entityMembers.length === 0) && (
        <Card>
          <CardContent className="py-4">
            <p className="text-center text-muted-foreground">No entity memberships found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 