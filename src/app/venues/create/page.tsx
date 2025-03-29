'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface Entity {
  id: number;
  name: string;
}

export default function CreateVenuePage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState('');
  const [amenities, setAmenities] = useState('');
  const [entityId, setEntityId] = useState('');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingEntities, setFetchingEntities] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchEntities();
  }, []);

  const fetchEntities = async () => {
    try {
      setFetchingEntities(true);
      const response = await fetch('/api/entities');
      
      if (!response.ok) {
        throw new Error('Failed to fetch entities');
      }
      
      const data = await response.json();
      
      // Filter entities where user is admin
      const userResponse = await fetch('/api/auth/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        const adminEntities = data.filter((entity: Entity) => 
          userData.entityMembers.some(
            (membership: any) => 
              membership.entity.id === entity.id && 
              membership.entityRole.name === 'Admin'
          )
        );
        setEntities(adminEntities);
      } else {
        setEntities([]);
      }
    } catch (error) {
      console.error('Error fetching entities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load entities. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setFetchingEntities(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Venue name is required',
        variant: 'destructive',
      });
      return;
    }
    
    if (!entityId) {
      toast({
        title: 'Error',
        description: 'Please select an entity',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/venues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description: description || null,
          address: address || null,
          entity_id: parseInt(entityId),
          capacity: capacity ? parseInt(capacity) : null,
          amenities: amenities || null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create venue');
      }
      
      const venue = await response.json();
      
      toast({
        title: 'Success',
        description: 'Venue created successfully',
      });
      
      router.push(`/venues/${venue.id}`);
    } catch (error: any) {
      console.error('Error creating venue:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create venue. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create New Venue</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Venue Details</CardTitle>
            <CardDescription>Enter the details for the new venue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Venue Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter venue name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter venue description"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter venue address"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Enter venue capacity"
                  min="1"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amenities">Amenities</Label>
                <Textarea
                  id="amenities"
                  value={amenities}
                  onChange={(e) => setAmenities(e.target.value)}
                  placeholder="Enter venue amenities"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="entity">Entity *</Label>
                {fetchingEntities ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading entities...</span>
                  </div>
                ) : entities.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    You don't have admin access to any entities. Contact an administrator.
                  </div>
                ) : (
                  <Select value={entityId} onValueChange={setEntityId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an entity" />
                    </SelectTrigger>
                    <SelectContent>
                      {entities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id.toString()}>
                          {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || fetchingEntities || entities.length === 0}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Venue
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}