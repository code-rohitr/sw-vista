'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EntityForm } from './EntityForm';
import { toast } from 'sonner';

interface Entity {
  id: number;
  name: string;
  description?: string;
  entity_type_id: number;
  parent_id?: number;
  entity_type: {
    id: number;
    name: string;
  };
  parent?: {
    id: number;
    name: string;
  };
}

export function EntityList() {
  const { user, hasPermission, hasEntityAccess } = useAuth();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);

  useEffect(() => {
    fetchEntities();
  }, []);

  const fetchEntities = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/entities');
      if (!response.ok) {
        throw new Error('Failed to fetch entities');
      }
      const data = await response.json();
      setEntities(data);
    } catch (error) {
      console.error('Error fetching entities:', error);
      toast.error('Failed to load entities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredEntities = entities.filter(entity => {
    const matchesSearch = entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && hasEntityAccess(entity.id);
  });

  const handleEdit = (entity: Entity) => {
    if (!hasPermission('update', '/api/entities', entity.id)) {
      toast.error('You do not have permission to edit this entity');
      return;
    }
    setEditingEntity(entity);
    setIsFormOpen(true);
  };

  const handleDelete = async (entity: Entity) => {
    if (!hasPermission('delete', '/api/entities', entity.id)) {
      toast.error('You do not have permission to delete this entity');
      return;
    }

    if (!confirm('Are you sure you want to delete this entity?')) {
      return;
    }

    try {
      const response = await fetch(`/api/entities/${entity.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete entity');
      }

      toast.success('Entity deleted successfully');
      fetchEntities();
    } catch (error) {
      console.error('Error deleting entity:', error);
      toast.error('Failed to delete entity');
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      const url = editingEntity
        ? `/api/entities/${editingEntity.id}`
        : '/api/entities';
      const method = editingEntity ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save entity');
      }

      toast.success(`Entity ${editingEntity ? 'updated' : 'created'} successfully`);
      setIsFormOpen(false);
      setEditingEntity(null);
      fetchEntities();
    } catch (error) {
      console.error('Error saving entity:', error);
      toast.error(`Failed to ${editingEntity ? 'update' : 'create'} entity`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search entities..."
          value={searchQuery}
          onChange={handleSearch}
          className="max-w-sm"
        />
        {hasPermission('create', '/api/entities') && (
          <Button onClick={() => setIsFormOpen(true)}>
            Add Entity
          </Button>
        )}
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEntities.map((entity) => (
            <div
              key={entity.id}
              className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold">{entity.name}</h3>
              <p className="text-sm text-gray-600">{entity.description}</p>
              <div className="mt-2 text-sm text-gray-500">
                <p>Type: {entity.entity_type.name}</p>
                {entity.parent && (
                  <p>Parent: {entity.parent.name}</p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                {hasPermission('update', '/api/entities', entity.id) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(entity)}
                  >
                    Edit
                  </Button>
                )}
                {hasPermission('delete', '/api/entities', entity.id) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(entity)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <EntityForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        initialData={editingEntity}
      />
    </div>
  );
} 