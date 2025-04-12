'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Plus } from 'lucide-react';
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
}

export default function EntitiesPage() {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const response = await fetch('/api/entities');
        if (response.ok) {
          const data = await response.json();
          setEntities(data);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to fetch entities',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching entities:', error);
        toast({
          title: 'Error',
          description: 'An error occurred while fetching entities',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchEntities();
    }
  }, [user, toast]);

  const canCreate = hasPermission('create', 'entities');

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Entities</h1>
        {canCreate && (
          <Button onClick={() => router.push('/entities/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Entity
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {entities.map((entity) => (
          <div
            key={entity.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            onClick={() => router.push(`/entities/${entity.id}`)}
          >
            <div className="flex items-center space-x-4">
              <Building2 className="h-6 w-6" />
              <div>
                <h2 className="font-semibold">{entity.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {entity.type.name}
                </p>
              </div>
            </div>
            {entity.parent && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Parent: {entity.parent.name}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 