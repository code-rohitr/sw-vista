'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface EntityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  isEditMode?: boolean;
}

export default function EntityForm({ isOpen, onClose, onSubmit, initialData, isEditMode = false }: EntityFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [entityTypeId, setEntityTypeId] = useState<number | ''>('');
  const [entityTypes, setEntityTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    // Reset form when dialog opens/closes or initialData changes
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setDescription(initialData.description || '');
        setEntityTypeId(initialData.entity_type_id || '');
      } else {
        setName('');
        setDescription('');
        setEntityTypeId('');
      }
      
      // Fetch entity types
      fetchEntityTypes();
    }
  }, [isOpen, initialData]);

  const fetchEntityTypes = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/entity-types', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch entity types');
      const data = await response.json();
      setEntityTypes(data);
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

  // Check the handleSubmit function in EntityForm.tsx
  const handleSubmit = async () => {
    try {
      // Make sure these fields are being set correctly
      if (!name || !entityTypeId) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }
      
      setIsLoading(true);
      
      // Call the parent's onSubmit directly instead of making our own API call
      await onSubmit({
        name,
        description,
        entity_type_id: entityTypeId
      });
      
      // Close the dialog on success
      onClose();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Entity' : 'Create New Entity'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update entity information.'
              : 'Fill in the details to create a new entity.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter entity name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter entity description"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entityType">Entity Type</Label>
            <select
              id="entityType"
              value={entityTypeId}
              onChange={(e) => setEntityTypeId(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Entity Type</option>
              {entityTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isEditMode ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}