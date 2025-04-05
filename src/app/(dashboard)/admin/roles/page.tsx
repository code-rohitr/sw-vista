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

interface Role {
  id: string;
  name: string;
  description: string | null;
  entityType: {
    id: string;
    name: string;
  };
  entity: {
    id: string;
    name: string;
  };
  template: {
    id: string;
    name: string;
  };
  entityRolePermissions: {
    permission: {
      id: string;
      name: string;
      action: string;
    };
    resource: {
      id: string;
      name: string;
      path: string;
    };
  }[];
}

interface EntityType {
  id: string;
  name: string;
}

interface Entity {
  id: string;
  name: string;
  entityType: {
    id: string;
    name: string;
  };
}

interface Template {
  id: string;
  name: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    entityTypeId: '',
    entityId: '',
    templateId: '',
  });
  const { toast } = useToast();

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/entity-roles');
      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch roles',
        variant: 'destructive',
      });
    }
  };

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

  const fetchEntities = async () => {
    try {
      const response = await fetch('/api/entities');
      if (!response.ok) throw new Error('Failed to fetch entities');
      const data = await response.json();
      setEntities(data);
    } catch (error) {
      console.error('Error fetching entities:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch entities',
        variant: 'destructive',
      });
    }
  };

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

  useEffect(() => {
    fetchRoles();
    fetchEntityTypes();
    fetchEntities();
    fetchTemplates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRole
        ? `/api/entity-roles/${editingRole.id}`
        : '/api/entity-roles';
      const method = editingRole ? 'PUT' : 'POST';

      // Convert field names for the API
      const requestData = {
        name: formData.name,
        description: formData.description,
        entity_type_id: formData.entityTypeId,
        entity_id: formData.entityId,
        template_id: formData.templateId
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save role');
      }

      toast({
        title: 'Success',
        description: `Role ${editingRole ? 'updated' : 'created'} successfully`,
      });

      setIsDialogOpen(false);
      setEditingRole(null);
      setFormData({ name: '', description: '', entityTypeId: '', entityId: '', templateId: '' });
      fetchRoles();
    } catch (error) {
      console.error('Error saving role:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save role',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const response = await fetch(`/api/entity-roles/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete role');

      toast({
        title: 'Success',
        description: 'Role deleted successfully',
      });

      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete role',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      entityTypeId: role.entityType.id,
      entityId: role.entity.id,
      templateId: role.template.id,
    });
    setIsDialogOpen(true);
  };

  // Filter entities based on selected entity type
  const filteredEntities = formData.entityTypeId
    ? entities.filter(entity => entity.entityType.id === formData.entityTypeId)
    : entities;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Roles</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingRole(null);
              setFormData({ name: '', description: '', entityTypeId: '', entityId: '', templateId: '' });
            }}>
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRole ? 'Edit Role' : 'Add Role'}
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
                <Label htmlFor="entityType">Entity Type</Label>
                <Select
                  value={formData.entityTypeId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, entityTypeId: value, entityId: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    {entityTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="entity">Entity</Label>
                <Select
                  value={formData.entityId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, entityId: value })
                  }
                  disabled={!formData.entityTypeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEntities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="template">Template</Label>
                <Select
                  value={formData.templateId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, templateId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  {editingRole ? 'Update' : 'Create'}
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
            <TableHead>Entity Type</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Template</TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell>{role.name}</TableCell>
              <TableCell>{role.description}</TableCell>
              <TableCell>{role.entityType.name}</TableCell>
              <TableCell>{role.entity.name}</TableCell>
              <TableCell>{role.template.name}</TableCell>
              <TableCell>
                {role.entityRolePermissions.length} permissions
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(role)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(role.id)}
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