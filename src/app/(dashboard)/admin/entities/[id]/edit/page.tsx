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
import { Loader2, ArrowLeft } from 'lucide-react';
import { use } from 'react';

interface EntityType {
  id: string;
  name: string;
}

interface Entity {
  id: string;
  name: string;
  entityType: {
    id: string;
    name: string;
  };
  parent?: {
    id: string;
    name: string;
  };
}

export default function EditEntityPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [parentEntities, setParentEntities] = useState<Entity[]>([]);
  const [entity, setEntity] = useState<Entity | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    entityTypeId: '',
    parentId: 'none',
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
      setFormData({
        name: data.name,
        entityTypeId: data.entityType.id,
        parentId: data.parent?.id || 'none',
      });
    } catch (error) {
      console.error('Error fetching entity:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch entity. Please try again.',
        variant: 'destructive',
      });
    }
  }, [resolvedParams.id, toast]);

  const fetchEntityTypes = useCallback(async () => {
    try {
      const response = await fetch('/api/entity-types', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch entity types');
      }
      const data = await response.json();
      setEntityTypes(data);
    } catch (error) {
      console.error('Error fetching entity types:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch entity types. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchParentEntities = useCallback(async () => {
    try {
      const response = await fetch('/api/entities', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch parent entities');
      }
      const data = await response.json();
      // Filter out the current entity and its children
      const filteredEntities = data.filter((e: Entity) => e.id !== resolvedParams.id);
      setParentEntities(filteredEntities);
    } catch (error) {
      console.error('Error fetching parent entities:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch parent entities. Please try again.',
        variant: 'destructive',
      });
    }
  }, [resolvedParams.id, toast]);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchEntity(),
        fetchEntityTypes(),
        fetchParentEntities(),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchEntity, fetchEntityTypes, fetchParentEntities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/entities/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          entityTypeId: formData.entityTypeId,
          parentId: formData.parentId === 'none' ? null : formData.parentId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update entity');
      }

      toast({
        title: 'Success',
        description: 'Entity updated successfully',
      });

      router.push(`/admin/entities/${resolvedParams.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update entity',
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
            onClick={() => router.push('/admin/entities')}
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
            onClick={() => router.push(`/admin/entities/${resolvedParams.id}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Edit Entity</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Entity Details</CardTitle>
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
                  <SelectItem value="none">None</SelectItem>
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
                onClick={() => router.push(`/admin/entities/${resolvedParams.id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 