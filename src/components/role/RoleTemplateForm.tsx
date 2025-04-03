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
import { toast } from 'sonner';

interface RoleTemplate {
  id: number;
  name: string;
  description?: string;
  permissions: string;
}

interface RoleTemplateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  initialData?: RoleTemplate | null;
}

export function RoleTemplateForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: RoleTemplateFormProps) {
  const { hasPermission } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: '',
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          description: initialData.description || '',
          permissions: initialData.permissions,
        });
      } else {
        setFormData({
          name: '',
          description: '',
          permissions: '',
        });
      }
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
      };

      onSubmit(data);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to save role template');
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
            {initialData ? 'Edit Role Template' : 'Create Role Template'}
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
            {!formData.name && (
              <p className="text-sm text-red-500">Name is required</p>
            )}
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
            <Label htmlFor="permissions">Permissions (JSON)</Label>
            <Textarea
              id="permissions"
              name="permissions"
              value={formData.permissions}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder='["create", "read", "update", "delete"]'
            />
            {!formData.permissions && (
              <p className="text-sm text-red-500">Permissions are required</p>
            )}
            {formData.permissions && (
              <p className="text-sm text-gray-500">
                Enter permissions as a JSON array of strings
              </p>
            )}
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