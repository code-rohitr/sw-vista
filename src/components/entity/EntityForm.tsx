'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface EntityType {
  id: number;
  name: string;
}

interface Entity {
  id: number;
  name: string;
  description?: string;
  entity_type_id: number;
  parent_id?: number;
}

interface EntityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  initialData?: Entity | null;
}

export function EntityForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: EntityFormProps) {
  const { hasPermission } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [parentEntities, setParentEntities] = useState<Entity[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    entity_type_id: '',
    parent_id: '',
  });

  useEffect(() => {
    if (open) {
      fetchEntityTypes();
      fetchParentEntities();
      if (initialData) {
        setFormData({
          name: initialData.name,
          description: initialData.description || '',
          entity_type_id: initialData.entity_type_id.toString(),
          parent_id: initialData.parent_id?.toString() || '',
        });
      } else {
        setFormData({
          name: '',
          description: '',
          entity_type_id: '',
          parent_id: '',
        });
      }
    }
  }, [open, initialData]);

  const fetchEntityTypes = async () => {
    try {
      const response = await fetch('/api/entity-types');
      if (!response.ok) {
        throw new Error('Failed to fetch entity types');
      }
      const data = await response.json();
      setEntityTypes(data);
    } catch (error) {
      console.error('Error fetching entity types:', error);
      toast.error('Failed to load entity types');
    }
  };

  const fetchParentEntities = async () => {
    try {
      const response = await fetch('/api/entities');
      if (!response.ok) {
        throw new Error('Failed to fetch parent entities');
      }
      const data = await response.json();
      // Filter out the current entity if editing
      const filteredEntities = initialData
        ? data.filter((entity: Entity) => entity.id !== initialData.id)
        : data;
      setParentEntities(filteredEntities);
    } catch (error) {
      console.error('Error fetching parent entities:', error);
      toast.error('Failed to load parent entities');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        ...formData,
        entity_type_id: parseInt(formData.entity_type_id),
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
      };

      onSubmit(data);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to save entity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Entity' : 'Create Entity'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entity_type_id">Entity Type</Label>
            <Select
              value={formData.entity_type_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, entity_type_id: value }))
              }
            >
              <SelectTrigger disabled={isLoading}>
                <SelectValue placeholder="Select entity type" />
              </SelectTrigger>
              <SelectContent>
                {entityTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!formData.entity_type_id && (
              <p className="text-sm text-red-500">Entity type is required</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent_id">Parent Entity (Optional)</Label>
            <Select
              value={formData.parent_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, parent_id: value }))
              }
            >
              <SelectTrigger disabled={isLoading}>
                <SelectValue placeholder="Select parent entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {parentEntities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id.toString()}>
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : initialData ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}