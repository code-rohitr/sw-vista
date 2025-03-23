'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Define interfaces for your data types
interface Entity {
  id: number;
  name: string;
  description?: string;
  entity_type_id: number;
}

interface EntityRole {
  id: number;
  name: string;
  description?: string;
  entity_id: number;
  entity_type_id: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  isSystemAdmin: boolean;
  systemRoles: {
    id: number;
    name: string;
    entity: Entity;
  }[];
  entityMembers: {
    entity: Entity;
    entityRole: EntityRole;
    entity_id: number;
    entity_role_id: number;
  }[];
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [entityRoles, setEntityRoles] = useState<EntityRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [entity_id, setEntityId] = useState('');
  const [entity_role_id, setEntityRoleId] = useState('');
  
  const { toast } = useToast();

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('Not authenticated');
  
        // Fetch all required data
        const [usersRes, entitiesRes] = await Promise.all([
          fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/entities', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        if (!usersRes.ok) throw new Error('Failed to fetch users');
        if (!entitiesRes.ok) throw new Error('Failed to fetch entities');

        const [usersData, entitiesData] = await Promise.all([
          usersRes.json(),
          entitiesRes.json()
        ]);

        setUsers(usersData);
        setEntities(entitiesData);
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

  // Fetch entity roles when entity is selected
  const fetchEntityRoles = async (entityId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/entity-roles?entityId=${entityId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch entity roles');
      const data = await response.json();
      setEntityRoles(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch entity roles',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setEntityId('');
    setEntityRoleId('');
    setSelectedUser(null);
    setIsEditMode(false);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };
  
  const handleOpenDialog = (user?: any) => {
    resetForm();
    
    if (user) {
      setSelectedUser(user);
      setUsername(user.username);
      setEmail(user.email);
      if (user.entityMembers?.[0]) {
        setEntityId(user.entityMembers[0].entity_id.toString());
        setEntityRoleId(user.entityMembers[0].entity_role_id.toString());
        fetchEntityRoles(user.entityMembers[0].entity_id.toString());
      }
      setIsEditMode(true);
    }
    
    setIsDialogOpen(true);
  };
  
  const handleCreateUser = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
  
      // Validate required fields
      if (!username || !email || !password || !entity_id || !entity_role_id) {
        throw new Error('All fields are required');
      }
  
      // Try with different field name combinations
      const userData = {
        username,
        email,
        password,
        // Try both formats to see which one works
        entity: parseInt(entity_id),
        role: parseInt(entity_role_id),
        entity_id: parseInt(entity_id),
        entity_role_id: parseInt(entity_role_id)
      };
  
      console.log('Sending user data:', userData);
  
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });
  
      // Log the full response for debugging
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || data.error || `Failed to create user: ${response.status} ${response.statusText}`);
      }
  
      // Update users list
      setUsers([...users, data]);
      
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    try {
      if (!selectedUser) {
        toast({
          title: 'Error',
          description: 'No user selected for update',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
  
      // Update field names to match what the server expects
      const updateData: any = {
        id: selectedUser.id,
      };
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (password) updateData.password = password;
      if (entity_id) updateData.entity = parseInt(entity_id);       // Changed from entity_id to entity
      if (entity_role_id) updateData.role = parseInt(entity_role_id); // Changed from entity_role_id to role
  
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Server response:', data);
        throw new Error(data.message || data.error || 'Failed to update user');
      }
  
      // Update users list
      setUsers(users.map(user => user.id === selectedUser.id ? data : user));
      
      toast({
        title: 'Success',
        description: 'User updated successfully',
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

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete user');
      }

      // Update users list
      setUsers(users.filter(user => user.id !== userId));
      
      toast({
        title: 'Success',
        description: 'User deleted successfully',
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

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button onClick={() => handleOpenDialog()}>Add New User</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>System Roles</TableHead>
                <TableHead>Entity Memberships</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.isSystemAdmin ? (
                      <span className="font-bold text-primary">System Admin</span>
                    ) : user.systemRoles?.length > 0 ? (
                      user.systemRoles.map(role => role.name).join(', ')
                    ) : (
                      'None'
                    )}
                  </TableCell>
                  <TableCell>
                    {user.entityMembers?.map((membership, index) => (
                      <div key={index}>
                        {membership.entity.name} ({membership.entityRole.name})
                        {index < user.entityMembers.length - 1 ? ', ' : ''}
                      </div>
                    )) || 'None'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(user)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit User' : 'Create New User'}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update user information. Leave password blank to keep current password.'
                : 'Fill in the details to create a new user.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={isEditMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {isEditMode && '(Leave blank to keep current password)'}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditMode ? 'Enter new password' : 'Enter password'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entity">Entity</Label>
              <Select value={entity_id} onValueChange={(value) => {
                setEntityId(value);
                setEntityRoleId('');
                fetchEntityRoles(value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an entity" />
                </SelectTrigger>
                <SelectContent>
                  {entities && entities.length > 0 ? (
                    entities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id.toString()}>
                        {entity.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-entities" disabled>No entities available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entityRole">Entity Role</Label>
              <Select value={entity_role_id} onValueChange={setEntityRoleId} disabled={!entity_id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an entity role" />
                </SelectTrigger>
                <SelectContent>
                  {entityRoles && entityRoles.length > 0 ? (
                    entityRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-entity-roles" disabled>
                      {entity_id ? 'No roles available for this entity' : 'Select an entity first'}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={isEditMode ? handleUpdateUser : handleCreateUser}>
              {isEditMode ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
