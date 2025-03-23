'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
// Remove the tabs import and use a simple state for tab switching

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
    description: string;
  };
}

interface Entity {
  id: number;
  name: string;
  description: string;
  entityType: {
    id: number;
    name: string;
  };
  entityMembers: EntityMember[];
}

export default function EntityDetailsPage() {
  const params = useParams();
  const entityId = params.id as string;
  const [entity, setEntity] = useState<Entity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members'); // Simple state for tab switching
  const { toast } = useToast();

  useEffect(() => {
    const fetchEntityDetails = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`/api/entities/${entityId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch entity details');
        const data = await response.json();
        setEntity(data);
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'An error occurred',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (entityId) {
      fetchEntityDetails();
    }
  }, [entityId, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">Loading entity details...</div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">Entity not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{entity.name}</h2>
          <p className="text-muted-foreground">{entity.description}</p>
          <div className="mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {entity.entityType?.name || 'Unknown Type'}
            </span>
          </div>
        </div>
        <Button onClick={() => window.history.back()}>Back to Entities</Button>
      </div>

      {/* Simple tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('members')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'members'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Details
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      {activeTab === 'members' && (
        <Card>
          <CardHeader>
            <CardTitle>Entity Members</CardTitle>
          </CardHeader>
          <CardContent>
            {entity.entityMembers && entity.entityMembers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entity.entityMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.user.username}</TableCell>
                      <TableCell>{member.user.email}</TableCell>
                      <TableCell>{member.entityRole.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4">No members found for this entity</div>
            )}
          </CardContent>
        </Card>
      )}
      
      {activeTab === 'details' && (
        <Card>
          <CardHeader>
            <CardTitle>Entity Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">ID</h3>
                <p>{entity.id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Name</h3>
                <p>{entity.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Description</h3>
                <p>{entity.description || 'No description'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Entity Type</h3>
                <p>{entity.entityType?.name || 'Unknown'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}