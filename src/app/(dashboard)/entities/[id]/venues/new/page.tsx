'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { use } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  adminOf: {
    id: string;
    name: string;
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

interface FormData {
  name: string;
  description: string;
  capacity: string;
  amenities: string;
  approvalUsers: string[];
}

export default function NewVenuePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [entity, setEntity] = useState<Entity | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    capacity: '',
    amenities: '',
    approvalUsers: [],
  });

  const fetchEntity = useCallback(async () => {
    try {
      const response = await fetch(`/api/entities/${resolvedParams.id}`, {
        credentials: 'include',
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
        description: 'Failed to fetch entity. Please try again.',
        variant: 'destructive',
      });
    }
  }, [resolvedParams.id, toast]);

  const fetchUsers = useCallback(async () => {
    try {
      console.log('Fetching users for entity:', resolvedParams.id);
      const response = await fetch(`/api/entities/${resolvedParams.id}/users`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      console.log('Users fetched:', data);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    }
  }, [resolvedParams.id, toast]);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchEntity(),
        fetchUsers(),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchEntity, fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Create venue
      const venueResponse = await fetch(`/api/entities/${resolvedParams.id}/venues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          capacity: parseInt(formData.capacity),
          amenities: formData.amenities,
        }),
      });

      if (!venueResponse.ok) {
        throw new Error('Failed to create venue');
      }

      const venue = await venueResponse.json();

      // Create approvals for each user in sequence
      for (let i = 0; i < formData.approvalUsers.length; i++) {
        const userId = formData.approvalUsers[i];
        await fetch(`/api/venues/${venue.id}/approvals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            approver_id: userId,
            status: 'pending',
            sequence: i + 1,
          }),
        });
      }

      toast({
        title: 'Success',
        description: 'Venue created successfully',
      });

      router.push(`/entities/${resolvedParams.id}/venues/${venue.id}`);
    } catch (error) {
      console.error('Error creating venue:', error);
      toast({
        title: 'Error',
        description: 'Failed to create venue',
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
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-muted-foreground">Entity not found</div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/entities')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Entities
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
            onClick={() => router.push(`/entities/${resolvedParams.id}/venues`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">New Venue</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Venue</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amenities">Amenities</Label>
              <Textarea
                id="amenities"
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Approval Sequence</Label>
              <div className="mt-2">
                <Select
                  value={formData.approvalUsers[formData.approvalUsers.length - 1] || ''}
                  onValueChange={(value) => {
                    if (!formData.approvalUsers.includes(value)) {
                      setFormData({
                        ...formData,
                        approvalUsers: [...formData.approvalUsers, value],
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select approval user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.username} ({user.email}) - Admin of: {user.adminOf.map(entity => entity.name).join(', ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-2">
                {formData.approvalUsers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Approval Sequence:</p>
                    <ul className="list-decimal list-inside">
                      {formData.approvalUsers.map((userId, index) => {
                        const user = users.find((u) => u.id === userId);
                        return (
                          <li key={userId} className="text-sm">
                            {index + 1}. {user?.username} ({user?.email})
                            {user && ` - Admin of: ${user.adminOf.map(entity => entity.name).join(', ')}`}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-2"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  approvalUsers: formData.approvalUsers.filter(
                                    (id) => id !== userId
                                  ),
                                });
                              }}
                            >
                              Remove
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/entities/${resolvedParams.id}/venues`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Venue'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 