'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Trash2 } from 'lucide-react';

interface EntityType {
  id: string;
  name: string;
  description: string | null;
}

export default function EntityTypesPage() {
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<EntityType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const { toast } = useToast();

  const fetchEntityTypes = async () => {
    try {
      const response = await fetch('/api/entity-types');
      if (!response.ok) throw new Error('Failed to fetch entity types');
      const data = await response.json();
      setEntityTypes(data);
    } catch (error) {
      console.error('Error fetching entity types:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch entity types',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchEntityTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingType
        ? `/api/entity-types/${editingType.id}`
        : '/api/entity-types';
      const method = editingType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save entity type');

      toast({
        title: 'Success',
        description: `Entity type ${editingType ? 'updated' : 'created'} successfully`,
      });

      setIsDialogOpen(false);
      setEditingType(null);
      setFormData({ name: '', description: '' });
      fetchEntityTypes();
    } catch (error) {
      console.error('Error saving entity type:', error);
      toast({
        title: 'Error',
        description: 'Failed to save entity type',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entity type?')) return;

    try {
      const response = await fetch(`/api/entity-types/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete entity type');

      toast({
        title: 'Success',
        description: 'Entity type deleted successfully',
      });

      fetchEntityTypes();
    } catch (error) {
      console.error('Error deleting entity type:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete entity type',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (type: EntityType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Entity Types</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingType(null);
              setFormData({ name: '', description: '' });
            }}>
              Add Entity Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Edit Entity Type' : 'Add Entity Type'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingType ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entityTypes.map((type) => (
            <TableRow key={type.id}>
              <TableCell>{type.name}</TableCell>
              <TableCell>{type.description}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(type)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(type.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 