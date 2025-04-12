'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Entity {
  id: string;
  name: string;
  description?: string;
  type: {
    id: string;
    name: string;
  };
  parent?: {
    id: string;
    name: string;
  };
  children?: {
    id: string;
    name: string;
  }[];
  entityType?: {
    id: string;
    name: string;
  };
}

export default function EntityPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEntity = async () => {
      try {
        const response = await fetch(`/api/entities/${id}`);
        if (response.ok) {
          const data = await response.json();
          setEntity(data);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to fetch entity details',
            variant: 'destructive',
          });
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching entity:', error);
        toast({
          title: 'Error',
          description: 'An error occurred while fetching entity details',
          variant: 'destructive',
        });
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchEntity();
    }
  }, [id, router, toast]);

  const handleEdit = () => {
    router.push(`/entities/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this entity?')) {
      return;
    }

    try {
      const response = await fetch(`/api/entities/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Entity deleted successfully',
        });
        router.push('/dashboard');
      } else {
        throw new Error('Failed to delete entity');
      }
    } catch (error) {
      console.error('Error deleting entity:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete entity',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-[200px]" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-[300px]" />
          <Skeleton className="h-4 w-[400px]" />
          <Skeleton className="h-4 w-[250px]" />
        </div>
      </div>
    );
  }

  if (!entity) {
    return null;
  }

  const canEdit = hasPermission('update', entity.id) || hasPermission('manage', entity.id);
  const canDelete = hasPermission('delete', entity.id) || hasPermission('manage', entity.id);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <Building2 className="h-6 w-6" />
            <h1 className="text-2xl font-bold">{entity.name}</h1>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {canEdit && (
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Entity Details</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</h3>
              <p>{entity.entityType?.name || 'Unknown Type'}</p>
            </div>
            {entity.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                <p>{entity.description}</p>
              </div>
            )}
            {entity.parent && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Parent Entity</h3>
                <p>{entity.parent.name}</p>
              </div>
            )}
          </div>
        </div>

        {entity.children && entity.children.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Child Entities</h2>
            <div className="grid gap-4">
              {entity.children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => router.push(`/entities/${child.id}`)}
                >
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4" />
                    <span>{child.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 