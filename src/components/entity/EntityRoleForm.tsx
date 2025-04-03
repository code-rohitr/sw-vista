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

interface RoleTemplate {
  id: number;
  name: string;
  description?: string;
  permissions: string;
}

interface EntityRole {
  id: number;
  name: string;
  description?: string;
  entity_id: number;
  entity_type_id: number;
  template_id?: number;
  template?: RoleTemplate;
}

interface EntityRoleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  entityId: number;
  initialData?: EntityRole | null;
}

export function EntityRoleForm({
  open,
  onOpenChange,
  onSubmit,
  entityId,
  initialData,
}: EntityRoleFormProps) {
  const { hasPermission } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_id: '',
  });

  useEffect(() => {
    if (open) {
      fetchRoleTemplates();
      if (initialData) {
        setFormData({
          name: initialData.name,
          description: initialData.description || '',
          template_id: initialData.template_id?.toString() || '',
        });
      } else {
        setFormData({
          name: '',
          description: '',
          template_id: '',
        });
      }
    }
  }, [open, initialData]);

  const fetchRoleTemplates = async () => {
    try {
      const response = await fetch('/api/role-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch role templates');
      }
      const data = await response.json();
      setRoleTemplates(data);
    } catch (error) {
      console.error('Error fetching role templates:', error);
      toast.error('Failed to load role templates');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        name: formData.name,
        description: formData.description,
        entity_id: entityId,
        template_id: formData.template_id ? parseInt(formData.template_id) : null,
      };

      onSubmit(data);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to save entity role');
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

  const handleTemplateChange = (templateId: string) => {
    setFormData((prev) => ({ ...prev, template_id: templateId }));
    if (templateId) {
      const template = roleTemplates.find((t) => t.id.toString() === templateId);
      if (template) {
        setFormData((prev) => ({
          ...prev,
          name: template.name,
          description: template.description || '',
        }));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Entity Role' : 'Create Entity Role'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template_id">Role Template</Label>
            <Select
              value={formData.template_id}
              onValueChange={handleTemplateChange}
            >
              <SelectTrigger disabled={isLoading}>
                <SelectValue placeholder="Select role template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {roleTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id.toString()}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading || !!formData.template_id}
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
              disabled={isLoading || !!formData.template_id}
            />
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