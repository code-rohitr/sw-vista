'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

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
    creator: {
      id: string;
      username: string;
      email: string;
    };
    approver: {
      id: string;
      username: string;
      email: string;
    } | null;
  }[];
}

export default function VenueDetailsPage({
  params,
}: {
  params: Promise<{ id: string; venueId: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Unwrap the params using React.use()
  const resolvedParams = use(params);
  const { id, venueId } = resolvedParams;

  const fetchVenue = useCallback(async () => {
    try {
      const response = await fetch(`/api/venues/${venueId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch venue');
      }
      const data = await response.json();
      setVenue(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch venue');
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    fetchVenue();
  }, [fetchVenue]);

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

  if (!venue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-500 mb-4">Venue not found</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  // Convert amenities to array if it's a string
  const amenities = Array.isArray(venue.amenities) 
    ? venue.amenities 
    : venue.amenities ? [venue.amenities] : [];

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{venue.name}</h1>
        <div className="space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            Back to Venues
          </Button>
          <Link href={`/entities/${id}/venues/${venueId}/edit`}>
            <Button>Edit Venue</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Venue Details</CardTitle>
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
              <div>
                <h3 className="font-semibold">Entity</h3>
                <p className="text-gray-600">{venue.entity.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {venue.bookings.length > 0 ? (
              <div className="space-y-4">
                {venue.bookings.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          {new Date(booking.startTime).toLocaleString()} -{' '}
                          {new Date(booking.endTime).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Created by: {booking.creator.username}
                        </p>
                        {booking.approver && (
                          <p className="text-sm text-gray-600">
                            Approved by: {booking.approver.username}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          booking.status === 'APPROVED'
                            ? 'success'
                            : booking.status === 'PENDING'
                            ? 'warning'
                            : 'destructive'
                        }
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No bookings yet</p>
                <Link href={`/entities/${id}/venues/${venueId}/bookings/new`}>
                  <Button>Create New Booking</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 