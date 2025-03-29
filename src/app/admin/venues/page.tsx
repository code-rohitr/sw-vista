'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Entity {
  id: number;
  name: string;
}

interface Venue {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  capacity: number | null;
  amenities: string | null;
  entity_id: number;
  entity: {
    id: number;
    name: string;
  };
  created_at: string;
}

export default function VenueManagementPage() {
  // Venues state
  const [venues, setVenues] = useState<Venue[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState('');
  const [amenities, setAmenities] = useState('');
  const [entityId, setEntityId] = useState<number | ''>('');
  
  const { toast } = useToast();
  
  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('Not authenticated');
  
        // Fetch all required data in parallel
        const [venuesRes, entitiesRes] = await Promise.all([
          fetch('/api/venues', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/entities', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        if (!venuesRes.ok) throw new Error('Failed to fetch venues');
        if (!entitiesRes.ok) throw new Error('Failed to fetch entities');

        const [venuesData, entitiesData] = await Promise.all([
          venuesRes.json(),
          entitiesRes.json()
        ]);

        setVenues(venuesData);
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
  
  const resetForm = () => {
    setName('');
    setDescription('');
    setAddress('');
    setCapacity('');
    setAmenities('');
    setEntityId('');
    setSelectedVenue(null);
    setIsEditMode(false);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };
  
  const handleOpenDialog = (venue?: Venue) => {
    resetForm();
    
    if (venue) {
      setSelectedVenue(venue);
      setName(venue.name);
      setDescription(venue.description || '');
      setAddress(venue.address || '');
      setCapacity(venue.capacity?.toString() || '');
      setAmenities(venue.amenities || '');
      setEntityId(venue.entity_id);
      setIsEditMode(true);
    }
    
    setIsDialogOpen(true);
  };
  
  const handleCreateVenue = async () => {
    try {
      if (!entityId) {
        toast({
          title: 'Error',
          description: 'Please select an entity',
          variant: 'destructive',
        });
        return;
      }
      
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
  
      const response = await fetch('/api/venues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          address,
          capacity,
          amenities,
          entity_id: entityId
        })
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create venue');
      }

      // Update venues list with the new venue
      setVenues([data, ...venues]);
      
      toast({
        title: 'Success',
        description: 'Venue created successfully',
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

  const handleUpdateVenue = async () => {
    try {
      if (!selectedVenue) return;
      
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
  
      const response = await fetch(`/api/venues/${selectedVenue.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          address,
          capacity,
          amenities,
          entity_id: entityId
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update venue');
      }

      // Update venues list
      setVenues(venues.map(venue => venue.id === selectedVenue.id ? data : venue));
      
      toast({
        title: 'Success',
        description: 'Venue updated successfully',
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

  const handleDeleteVenue = async (venueId: number) => {
    if (!confirm('Are you sure you want to delete this venue?')) return;
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/venues/${venueId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete venue');
      }

      // Update venues list
      setVenues(venues.filter(venue => venue.id !== venueId));
      
      toast({
        title: 'Success',
        description: 'Venue deleted successfully',
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

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Venue Management</h1>
        <Button onClick={() => handleOpenDialog()}>Create New Venue</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Venues</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading...</p>}
          
          {!isLoading && venues.length === 0 && (
            <p>No venues found. Create one to get started.</p>
          )}
          
          {!isLoading && venues.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {venues.map((venue) => (
                  <TableRow key={venue.id}>
                    <TableCell>{venue.id}</TableCell>
                    <TableCell>{venue.name}</TableCell>
                    <TableCell>{venue.entity?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {venue.address || 'N/A'}
                    </TableCell>
                    <TableCell>{venue.capacity || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenDialog(venue)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteVenue(venue.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Venue' : 'Create Venue'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Update the details of this venue.' 
                : 'Fill in the details to create a new venue.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            {!isEditMode && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="entity" className="text-right">
                  Entity
                </Label>
                <select
                  id="entity"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value ? parseInt(e.target.value) : '')}
                  className="col-span-3 p-2 border rounded"
                  disabled={isEditMode}
                >
                  <option value="">Select Entity</option>
                  {entities.map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capacity" className="text-right">
                Capacity
              </Label>
              <Input
                id="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amenities" className="text-right">
                Amenities
              </Label>
              <Textarea
                id="amenities"
                value={amenities}
                onChange={(e) => setAmenities(e.target.value)}
                placeholder="List amenities separated by commas"
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={isEditMode ? handleUpdateVenue : handleCreateVenue}
              disabled={!name}
            >
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}