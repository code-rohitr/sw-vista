'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Venue {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  amenities: string | string[];
  location?: string;
  entity: {
    id: string;
    name: string;
  };
  bookings?: {
    id: string;
    startTime: Date;
    endTime: Date;
    status: string;
  }[];
}

interface Entity {
  id: string;
  name: string;
}

export default function VenuesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchVenues = useCallback(async () => {
    try {
      const response = await fetch('/api/venues', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch venues');
      }
      const data = await response.json();
      setVenues(data);
      setFilteredVenues(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch venues');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEntities = useCallback(async () => {
    try {
      const response = await fetch('/api/entities', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch entities');
      }
      const data = await response.json();
      setEntities(data);
    } catch (err) {
      console.error('Error fetching entities:', err);
    }
  }, []);

  useEffect(() => {
    fetchVenues();
    fetchEntities();
  }, [fetchVenues, fetchEntities]);

  // Filter venues based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVenues(venues);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = venues.filter((venue) => {
      const amenities = Array.isArray(venue.amenities) 
        ? venue.amenities 
        : venue.amenities ? [venue.amenities] : [];

      return (
        venue.name.toLowerCase().includes(query) ||
        (venue.description?.toLowerCase().includes(query) ?? false) ||
        (venue.location?.toLowerCase().includes(query) ?? false) ||
        amenities.some(amenity => amenity.toLowerCase().includes(query)) ||
        venue.entity.name.toLowerCase().includes(query)
      );
    });
    setFilteredVenues(filtered);
  }, [searchQuery, venues]);

  const handleCreateVenue = () => {
    if (selectedEntity) {
      router.push(`/entities/${selectedEntity}/venues/new`);
      setIsDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Venues</h1>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Venue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Entity</DialogTitle>
                <DialogDescription>
                  Choose an entity to create a venue for
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Select
                  value={selectedEntity}
                  onValueChange={setSelectedEntity}
                >
                  <SelectTrigger>
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
                <Button
                  className="w-full"
                  onClick={handleCreateVenue}
                  disabled={!selectedEntity}
                >
                  Continue
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filteredVenues.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'No venues found matching your search' : 'No venues found'}
          </p>
          {searchQuery && (
            <Button variant="outline" onClick={() => setSearchQuery('')} className="mb-4">
              Clear Search
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Your First Venue</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Entity</DialogTitle>
                <DialogDescription>
                  Choose an entity to create a venue for
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Select
                  value={selectedEntity}
                  onValueChange={setSelectedEntity}
                >
                  <SelectTrigger>
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
                <Button
                  className="w-full"
                  onClick={handleCreateVenue}
                  disabled={!selectedEntity}
                >
                  Continue
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.map((venue) => {
            // Convert amenities to array if it's a string
            const amenities = Array.isArray(venue.amenities) 
              ? venue.amenities 
              : venue.amenities ? [venue.amenities] : [];

            return (
              <Card key={venue.id}>
                <CardHeader>
                  <CardTitle>{venue.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold">Description</h3>
                      <p className="text-gray-600">{venue.description || 'No description provided'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">Capacity</h3>
                      <p className="text-gray-600">{venue.capacity} people</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">Location</h3>
                      <p className="text-gray-600">{venue.location || 'No location provided'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">Amenities</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {amenities.length > 0 ? (
                          amenities.map((amenity, index) => (
                            <Badge key={index} variant="secondary">
                              {amenity}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-gray-600">No amenities listed</p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">
                        {venue.bookings?.length || 0} bookings
                      </Badge>
                      <Link href={`/entities/${venue.entity.id}/venues/${venue.id}`}>
                        <Button variant="outline">View Details</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 