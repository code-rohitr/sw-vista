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

interface EntityType {
  id: string;
  name: string;
}

interface Entity {
  id: string;
  name: string;
}

export default function NewEntityPage() {
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [parentEntities, setParentEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    entityTypeId: '',
    parentId: '',
  });

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

  const fetchParentEntities = useCallback(async () => {
    try {
      const response = await fetch('/api/entities', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch parent entities');
      const data = await response.json();
      setParentEntities(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch parent entities',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEntityTypes();
    fetchParentEntities();
  }, [fetchEntityTypes, fetchParentEntities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/entities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: formData.name,
          entityTypeId: formData.entityTypeId,
          parentId: formData.parentId || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create entity');
      }

      toast({
        title: 'Success',
        description: 'Entity created successfully',
      });

      router.push('/admin/entities');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create entity',
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">New Entity</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Entity</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="entityType" className="text-sm font-medium">
                Entity Type
              </label>
              <Select
                value={formData.entityTypeId}
                onValueChange={(value) =>
                  setFormData({ ...formData, entityTypeId: value })
                }
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
              <label htmlFor="parent" className="text-sm font-medium">
                Parent Entity (Optional)
              </label>
              <Select
                value={formData.parentId}
                onValueChange={(value) =>
                  setFormData({ ...formData, parentId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {parentEntities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/entities')}
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
                  'Create Entity'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 