'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, MapPin, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Venue {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  capacity: number | null;
  amenities: string | null;
  entity: {
    id: number;
    name: string;
  };
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/venues');
      
      if (!response.ok) {
        throw new Error('Failed to fetch venues');
      }
      
      const data = await response.json();
      setVenues(data);
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast({
        title: 'Error',
        description: 'Failed to load venues. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVenue = () => {
    router.push('/venues/create');
  };

  const handleViewVenue = (id: number) => {
    router.push(`/venues/${id}`);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Venues</h1>
        <Button onClick={handleCreateVenue}>
          <Plus className="mr-2 h-4 w-4" /> Create Venue
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : venues.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-muted-foreground">No venues found. Create your first venue!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <Card key={venue.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewVenue(venue.id)}>
              <CardHeader className="pb-2">
                <CardTitle>{venue.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {venue.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{venue.description}</p>
                )}
                <div className="flex flex-col gap-2 mt-4">
                  {venue.address && (
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{venue.address}</span>
                    </div>
                  )}
                  {venue.capacity && (
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Capacity: {venue.capacity}</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    Managed by: {venue.entity.name}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}