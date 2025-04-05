'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus } from 'lucide-react';

interface Venue {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  amenities: string | string[];
  location: string;
  entity: {
    id: string;
    name: string;
  };
  bookings: {
    id: string;
    startTime: Date;
    endTime: Date;
    status: string;
  }[];
}

export default function VenuesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Unwrap the params using React.use()
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const fetchVenues = useCallback(async () => {
    try {
      const response = await fetch(`/api/entities/${id}/venues`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch venues');
      }
      const data = await response.json();
      setVenues(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch venues');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Venues</h1>
        <Link href={`/entities/${id}/venues/new`}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Venue
          </Button>
        </Link>
      </div>

      {venues.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No venues found</p>
          <Link href={`/entities/${id}/venues/new`}>
            <Button>Create Your First Venue</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => {
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
                      <p className="text-gray-600">{venue.location}</p>
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
                        {venue.bookings.length} bookings
                      </Badge>
                      <Link href={`/entities/${id}/venues/${venue.id}`}>
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