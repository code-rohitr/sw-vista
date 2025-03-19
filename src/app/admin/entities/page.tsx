'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EntityForm from '@/components/entity/EntityForm';

export default function EntityManagementPage() {
  const [entities, setEntities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  
  const { toast } = useToast();

  // Fetch entities on component mount
  useEffect(() => {
    fetchEntities();
  }, []);

  const fetchEntities = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/entities', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch entities');
      const data = await response.json();
      setEntities(data);
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

  const handleOpenDialog = (entity?: any) => {
    setSelectedEntity(entity || null);
    setIsEditMode(!!entity);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedEntity(null);
  };

  const handleSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      let response;
      if (isEditMode && selectedEntity) {
        // Update existing entity
        response = await fetch(`/api/entities/${selectedEntity.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });
      } else {
        // Create new entity
        response = await fetch('/api/entities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });
      }

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to process entity');
      }

      // Update entities list
      if (isEditMode && selectedEntity) {
        setEntities(entities.map(entity => entity.id === selectedEntity.id ? responseData : entity));
        toast({
          title: 'Success',
          description: 'Entity updated successfully',
        });
      } else {
        setEntities([...entities, responseData]);
        toast({
          title: 'Success',
          description: 'Entity created successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      throw error; // Re-throw to let the form component know there was an error
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEntity = async (entityId: number) => {
    if (!confirm('Are you sure you want to delete this entity?')) return;
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/entities/${entityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete entity');
      }

      // Update entities list
      setEntities(entities.filter(entity => entity.id !== entityId));
      
      toast({
        title: 'Success',
        description: 'Entity deleted successfully',
      });
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

  if (isLoading && entities.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">Loading entities...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Entity Management</h2>
        <Button onClick={() => handleOpenDialog()}>Add New Entity</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entities</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entities.map((entity) => (
                <TableRow key={entity.id}>
                  <TableCell>{entity.id}</TableCell>
                  <TableCell>{entity.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{entity.description}</TableCell>
                  <TableCell>{new Date(entity.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(entity)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteEntity(entity.id)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EntityForm
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        initialData={selectedEntity}
        isEditMode={isEditMode}
      />
    </div>
  );
}