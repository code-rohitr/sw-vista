'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Edit, Trash2, Calendar, MapPin, Users, Info } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

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

interface Booking {
  id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  status: string;
  entity: {
    id: number;
    name: string;
  };
  creator: {
    id: number;
    username: string;
  };
}

export default function VenueDetailPage({ params }: { params: { id: string } }) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const venueId = parseInt(params.id);

  useEffect(() => {
    fetchVenueDetails();
    fetchVenueBookings();
  }, [venueId]);

  const fetchVenueDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/venues/${venueId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/venues');
          return;
        }
        throw new Error('Failed to fetch venue details');
      }
      
      const data = await response.json();
      setVenue(data);
      
      // Check if user is admin of this venue's entity
      const userResponse = await fetch('/api/auth/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        const isEntityAdmin = userData.entityMembers.some(
          (membership: any) => 
            membership.entity.id === data.entity_id && 
            membership.entityRole.name === 'Admin'
        );
        setIsAdmin(isEntityAdmin);
      }
    } catch (error) {
      console.error('Error fetching venue details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load venue details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVenueBookings = async () => {
    try {
      const response = await fetch(`/api/venue-bookings?venueId=${venueId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch venue bookings');
      }
      
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching venue bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load venue bookings.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = () => {
    router.push(`/venues/${venueId}/edit`);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/venues/${venueId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete venue');
      }
      
      toast({
        title: 'Success',
        description: 'Venue deleted successfully.',
      });
      
      router.push('/venues');
    } catch (error: any) {
      console.error('Error deleting venue:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete venue. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleCreateBooking = () => {
    router.push(`/venue-bookings/create?venueId=${venueId}`);
  };

  const handleViewBooking = (bookingId: number) => {
    router.push(`/venue-bookings/${bookingId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!venue) {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{venue.name}</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="details">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Venue Information</CardTitle>
              <CardDescription>Details about this venue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {venue.description && (
                <div>
                  <h3 className="text-sm font-medium flex items-center">
                    <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                    Description
                  </h3>
                  <p className="mt-1">{venue.description}</p>
                </div>
              )}
              
              {venue.address && (
                <div>
                  <h3 className="text-sm font-medium flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    Address
                  </h3>
                  <p className="mt-1">{venue.address}</p>
                </div>
              )}
              
              {venue.capacity && (
                <div>
                  <h3 className="text-sm font-medium flex items-center">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    Capacity
                  </h3>
                  <p className="mt-1">{venue.capacity} people</p>
                </div>
              )}
              
              {venue.amenities && (
                <div>
                  <h3 className="text-sm font-medium">Amenities</h3>
                  <p className="mt-1">{venue.amenities}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium">Managed By</h3>
                <p className="mt-1">{venue.entity.name}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bookings">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Venue Bookings</h2>
            <Button onClick={handleCreateBooking}>
              <Calendar className="mr-2 h-4 w-4" /> Book Venue
            </Button>
          </div>
          
          {bookings.length === 0 ? (
            <div className="text-center p-8 border rounded-lg">
              <p className="text-muted-foreground">No bookings found for this venue.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card 
                  key={booking.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleViewBooking(booking.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{booking.title}</CardTitle>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </div>
                    </div>
                    <CardDescription>
                      {format(new Date(booking.start_time), 'PPP')} • {format(new Date(booking.start_time), 'p')} - {format(new Date(booking.end_time), 'p')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {booking.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{booking.description}</p>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      Booked by: {booking.entity.name} ({booking.creator.username})
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the venue and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}