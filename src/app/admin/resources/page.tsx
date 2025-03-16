'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ResourcesManagementPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [resourceName, setResourceName] = useState('');
  const [resourcePath, setResourcePath] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');
  
  const { toast } = useToast();

  // Fetch resources and roles on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('Not authenticated');

        // Fetch resources
        const resourcesResponse = await fetch('/api/resources', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!resourcesResponse.ok) throw new Error('Failed to fetch resources');
        const resourcesData = await resourcesResponse.json();
        setResources(resourcesData);

        // Fetch roles with permissions
        const rolesResponse = await fetch('/api/roles', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!rolesResponse.ok) throw new Error('Failed to fetch roles');
        const rolesData = await rolesResponse.json();
        
        // Fetch role permissions for each role
        const rolesWithPermissions = await Promise.all(
          rolesData.map(async (role: any) => {
            const permissionsResponse = await fetch(`/api/roles/${role.id}/permissions`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (permissionsResponse.ok) {
              const permissionsData = await permissionsResponse.json();
              return {
                ...role,
                rolePermissions: permissionsData
              };
            }
            
            return {
              ...role,
              rolePermissions: []
            };
          })
        );
        
        setRoles(rolesWithPermissions);
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

    fetchData();
  }, [toast]);

  const handleOpenDialog = () => {
    setResourceName('');
    setResourcePath('');
    setResourceDescription('');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleCreateResource = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: resourceName,
          path: resourcePath,
          description: resourceDescription
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create resource');
      }

      // Update resources list
      setResources([...resources, data]);
      
      toast({
        title: 'Success',
        description: `Resource "${resourceName}" created successfully`,
      });
      
      handleCloseDialog();
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

  const handleDeleteResource = async (resourceId: number) => {
    if (!confirm('Are you sure you want to delete this resource? This will also delete all permissions associated with this resource.')) return;
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete resource');
      }

      // Update resources list
      setResources(resources.filter(resource => resource.id !== resourceId));
      
      toast({
        title: 'Success',
        description: 'Resource deleted successfully',
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

  // Count how many role permissions use a specific resource
  const getResourceUsageCount = (resourceId: number) => {
    return roles.reduce((count, role) => {
      const usageCount = role.rolePermissions.filter((rp: any) => rp.resource_id === resourceId).length;
      return count + usageCount;
    }, 0);
  };

  // Get roles that use a specific resource
  const getRolesUsingResource = (resourceId: number) => {
    return roles.filter(role => 
      role.rolePermissions.some((rp: any) => rp.resource_id === resourceId)
    );
  };

  if (isLoading && resources.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">Loading resources...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Resources Management</h2>
        <Button onClick={handleOpenDialog}>Create New Resource</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Used By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell>{resource.id}</TableCell>
                  <TableCell>{resource.name}</TableCell>
                  <TableCell>{resource.path}</TableCell>
                  <TableCell>{resource.description || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getRolesUsingResource(resource.id).map(role => (
                        <span 
                          key={role.id} 
                          className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs"
                        >
                          {role.name}
                        </span>
                      ))}
                      {getResourceUsageCount(resource.id) === 0 && (
                        <span className="text-gray-500 text-xs">Not used</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteResource(resource.id)}
                      disabled={getResourceUsageCount(resource.id) > 0} // Prevent deleting resources in use
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Resource</DialogTitle>
            <DialogDescription>
              Create a new resource that can be used in permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resourceName">Resource Name</Label>
              <Input
                id="resourceName"
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                placeholder="Enter resource name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resourcePath">Resource Path</Label>
              <Input
                id="resourcePath"
                value={resourcePath}
                onChange={(e) => setResourcePath(e.target.value)}
                placeholder="Enter resource path (e.g., /api/users)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resourceDescription">Description</Label>
              <Input
                id="resourceDescription"
                value={resourceDescription}
                onChange={(e) => setResourceDescription(e.target.value)}
                placeholder="Enter resource description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateResource}
              disabled={!resourceName || !resourcePath}
            >
              Create Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
