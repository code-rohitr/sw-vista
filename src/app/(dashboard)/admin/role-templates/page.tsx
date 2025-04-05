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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Permission {
  id: string;
  name: string;
  action: string;
}

interface Resource {
  id: string;
  name: string;
  path: string;
}

interface RoleTemplate {
  id: string;
  name: string;
  description: string | null;
  permissions: {
    permission: Permission;
    resource: Resource;
  }[];
}

export default function RoleTemplatesPage() {
  const [templates, setTemplates] = useState<RoleTemplate[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RoleTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as { permission_id: string; resource_id: string }[],
  });
  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/role-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch templates',
        variant: 'destructive',
      });
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/permissions');
      if (!response.ok) throw new Error('Failed to fetch permissions');
      const data = await response.json();
      setPermissions(data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch permissions',
        variant: 'destructive',
      });
    }
  };

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/resources');
      if (!response.ok) throw new Error('Failed to fetch resources');
      const data = await response.json();
      setResources(data);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch resources',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchPermissions();
    fetchResources();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTemplate
        ? `/api/role-templates/${editingTemplate.id}`
        : '/api/role-templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save template');
      }

      toast({
        title: 'Success',
        description: `Template ${editingTemplate ? 'updated' : 'created'} successfully`,
      });

      setIsDialogOpen(false);
      setEditingTemplate(null);
      setFormData({ name: '', description: '', permissions: [] });
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save template',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/role-templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete template');

      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (template: RoleTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      permissions: template.permissions.map(p => ({
        permission_id: p.permission.id,
        resource_id: p.resource.id,
      })),
    });
    setIsDialogOpen(true);
  };

  const handleAddPermission = () => {
    setFormData({
      ...formData,
      permissions: [
        ...formData.permissions,
        { permission_id: '', resource_id: '' },
      ],
    });
  };

  const handleRemovePermission = (index: number) => {
    setFormData({
      ...formData,
      permissions: formData.permissions.filter((_, i) => i !== index),
    });
  };

  const handlePermissionChange = (
    index: number,
    field: 'permission_id' | 'resource_id',
    value: string
  ) => {
    const newPermissions = [...formData.permissions];
    newPermissions[index] = {
      ...newPermissions[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      permissions: newPermissions,
    });
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Role Templates</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTemplate(null);
              setFormData({ name: '', description: '', permissions: [] });
            }}>
              Add Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Add Template'}
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
              <div>
                <Label>Permissions</Label>
                <div className="space-y-2">
                  {formData.permissions.map((permission, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label>Permission</Label>
                        <Select
                          value={permission.permission_id}
                          onValueChange={(value) =>
                            handlePermissionChange(index, 'permission_id', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select permission" />
                          </SelectTrigger>
                          <SelectContent>
                            {permissions.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} ({p.action})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label>Resource</Label>
                        <Select
                          value={permission.resource_id}
                          onValueChange={(value) =>
                            handlePermissionChange(index, 'resource_id', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select resource" />
                          </SelectTrigger>
                          <SelectContent>
                            {resources.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.name} ({r.path})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePermission(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddPermission}
                  >
                    Add Permission
                  </Button>
                </div>
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
                  {editingTemplate ? 'Update' : 'Create'}
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
            <TableHead>Permissions</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell>{template.name}</TableCell>
              <TableCell>{template.description}</TableCell>
              <TableCell>
                {template.permissions.map((p) => (
                  <div key={`${p.permission.id}-${p.resource.id}`}>
                    {p.permission.name} ({p.permission.action}) on{' '}
                    {p.resource.name} ({p.resource.path})
                  </div>
                ))}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(template)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(template.id)}
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