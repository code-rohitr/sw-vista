'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { use } from 'react';

interface Entity {
  id: string;
  name: string;
  description: string | null;
  entityType: {
    id: string;
    name: string;
  };
}

interface Member {
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

export default function EntityMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

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
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id, toast]);

  useEffect(() => {
    fetchEntity();
    fetchMembers();
  }, [fetchEntity, fetchMembers]);

  const handleRemoveMember = async (memberId: string) => {
    try {
      setRemovingMember(memberId);
      const response = await fetch(`/api/entities/${resolvedParams.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      toast({
        title: 'Success',
        description: 'Member removed successfully',
      });

      // Refresh members list
      fetchMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive',
      });
    } finally {
      setRemovingMember(null);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{entity?.name} Members</h1>
          <p className="text-muted-foreground">{entity?.description}</p>
        </div>
        <Button onClick={() => router.push(`/admin/entities/${resolvedParams.id}/members/add`)}>
          Add Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Manage entity members and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.user.username}</TableCell>
                  <TableCell>{member.user.email}</TableCell>
                  <TableCell>{member.entityRole.name}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveMember(member.user.id)}
                      disabled={removingMember === member.user.id}
                    >
                      {removingMember === member.user.id ? 'Removing...' : 'Remove'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No members found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 