'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RoleTemplateForm } from './RoleTemplateForm';
import { toast } from 'sonner';

interface RoleTemplate {
  id: number;
  name: string;
  description?: string;
  permissions: string;
}

export function RoleTemplateList() {
  const { hasPermission } = useAuth();
  const [templates, setTemplates] = useState<RoleTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RoleTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/role-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch role templates');
      }
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching role templates:', error);
      toast.error('Failed to load role templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleEdit = (template: RoleTemplate) => {
    if (!hasPermission('update', '/api/role-templates', template.id)) {
      toast.error('You do not have permission to edit this role template');
      return;
    }
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  const handleDelete = async (template: RoleTemplate) => {
    if (!hasPermission('delete', '/api/role-templates', template.id)) {
      toast.error('You do not have permission to delete this role template');
      return;
    }

    if (!confirm('Are you sure you want to delete this role template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/role-templates/${template.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete role template');
      }

      toast.success('Role template deleted successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting role template:', error);
      toast.error('Failed to delete role template');
    }
  };

  const handleFormSubmit = async (formData: any) => {
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
        throw new Error('Failed to save role template');
      }

      toast.success(
        `Role template ${editingTemplate ? 'updated' : 'created'} successfully`
      );
      setIsFormOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving role template:', error);
      toast.error(`Failed to ${editingTemplate ? 'update' : 'create'} role template`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search role templates..."
          value={searchQuery}
          onChange={handleSearch}
          className="max-w-sm"
        />
        {hasPermission('create', '/api/role-templates') && (
          <Button onClick={() => setIsFormOpen(true)}>
            Add Role Template
          </Button>
        )}
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold">{template.name}</h3>
              <p className="text-sm text-gray-600">{template.description}</p>
              <div className="mt-2">
                <h4 className="text-sm font-medium">Permissions:</h4>
                <pre className="mt-1 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                  {template.permissions}
                </pre>
              </div>
              <div className="mt-4 flex gap-2">
                {hasPermission('update', '/api/role-templates', template.id) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    Edit
                  </Button>
                )}
                {hasPermission('delete', '/api/role-templates', template.id) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(template)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <RoleTemplateForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        initialData={editingTemplate}
      />
    </div>
  );
} 