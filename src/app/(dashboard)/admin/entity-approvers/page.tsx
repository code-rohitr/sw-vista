'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

interface Entity {
  id: string;
  name: string;
}

interface User {
  id: string;
  username: string;
  email: string;
}

interface EntityApprover {
  id: string;
  entity: Entity;
  approver: User;
  created_at: string;
}

export default function EntityApproversPage() {
  const { toast } = useToast();
  const [approvers, setApprovers] = useState<EntityApprover[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    entity_id: '',
    approver_id: '',
  });

  // Fetch approvers, entities, and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [approversRes, entitiesRes, usersRes] = await Promise.all([
          fetch('/api/entity-approvers'),
          fetch('/api/entities'),
          fetch('/api/users'),
        ]);

        if (!approversRes.ok || !entitiesRes.ok || !usersRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [approversData, entitiesData, usersData] = await Promise.all([
          approversRes.json(),
          entitiesRes.json(),
          usersRes.json(),
        ]);

        setApprovers(approversData);
        setEntities(entitiesData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Handle select input changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/entity-approvers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create entity approver');
      }

      const newApprover = await response.json();
      setApprovers((prev) => [...prev, newApprover]);
      setIsDialogOpen(false);
      setFormData({
        entity_id: '',
        approver_id: '',
      });
      toast({
        title: 'Success',
        description: 'Entity approver created successfully',
      });
    } catch (error) {
      console.error('Error creating entity approver:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create entity approver',
        variant: 'destructive',
      });
    }
  };

  // Handle deleting an entity approver
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entity approver?')) {
      return;
    }

    try {
      const response = await fetch(`/api/entity-approvers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete entity approver');
      }

      setApprovers((prev) => prev.filter((approver) => approver.id !== id));
      toast({
        title: 'Success',
        description: 'Entity approver deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting entity approver:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete entity approver',
        variant: 'destructive',
      });
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Entity Approvers</h1>
        <Button onClick={() => setIsDialogOpen(true)}>Add Approver</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entity</TableHead>
              <TableHead>Approver</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Added On</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {approvers.map((approver) => (
              <TableRow key={approver.id}>
                <TableCell className="font-medium">{approver.entity.name}</TableCell>
                <TableCell>{approver.approver.username}</TableCell>
                <TableCell>{approver.approver.email}</TableCell>
                <TableCell>{formatDate(approver.created_at)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(approver.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add Approver Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Entity Approver</DialogTitle>
            <DialogDescription>
              Select an entity and a user to assign as an approver.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="entity_id" className="text-right">
                  Entity
                </Label>
                <Select
                  value={formData.entity_id}
                  onValueChange={(value) => handleSelectChange('entity_id', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select an entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="approver_id" className="text-right">
                  Approver
                </Label>
                <Select
                  value={formData.approver_id}
                  onValueChange={(value) => handleSelectChange('approver_id', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.username} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!formData.entity_id || !formData.approver_id}>
                Add Approver
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 