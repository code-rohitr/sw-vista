'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

interface Venue {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  capacity: number | null;
  entity_id: number;
}

interface Entity {
  id: number;
  name: string;
}

interface Booking {
  id: number;
  venue_id: number;
  entity_id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  status: string;
  created_by: number;
  approved_by: number | null;
  created_at: string;
  venue: Venue;
  entity: Entity;
  creator: {
    id: number;
    username: string;
  };
  approver: {
    id: number;
    username: string;
  } | null;
}

export default function BookingsPage() {
  // State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [availableVenues, setAvailableVenues] = useState<Venue[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [userEntities, setUserEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchingVenues, setIsSearchingVenues] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showAvailableVenues, setShowAvailableVenues] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venueId, setVenueId] = useState<number | ''>('');
  const [entityId, setEntityId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  // Fetch data on component mount
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('Not authenticated');
  
        // Fetch all required data in parallel
        const [bookingsRes, venuesRes, entitiesRes, userEntitiesRes] = await Promise.all([
          fetch('/api/bookings', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/venues', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/entities', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/users/me/entities', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        if (!bookingsRes.ok) throw new Error('Failed to fetch bookings');
        if (!venuesRes.ok) throw new Error('Failed to fetch venues');
        if (!entitiesRes.ok) throw new Error('Failed to fetch entities');
        if (!userEntitiesRes.ok) throw new Error('Failed to fetch user entities');

        const [bookingsData, venuesData, entitiesData, userEntitiesData] = await Promise.all([
          bookingsRes.json(),
          venuesRes.json(),
          entitiesRes.json(),
          userEntitiesRes.json()
        ]);

        setBookings(bookingsData);
        setVenues(venuesData);
        setEntities(entitiesData);
        setUserEntities(userEntitiesData);
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
  }, [user, authLoading, router, toast]);
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setVenueId('');
    setEntityId('');
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setSelectedBooking(null);
    setIsEditMode(false);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };
  
  const handleOpenDialog = (booking?: Booking) => {
    resetForm();
    
    if (booking) {
      setSelectedBooking(booking);
      setTitle(booking.title);
      setDescription(booking.description || '');
      setVenueId(booking.venue_id);
      
      const startDateTime = new Date(booking.start_time);
      const endDateTime = new Date(booking.end_time);
      
      setStartDate(format(startDateTime, 'yyyy-MM-dd'));
      setStartTime(format(startDateTime, 'HH:mm'));
      setEndDate(format(endDateTime, 'yyyy-MM-dd'));
      setEndTime(format(endDateTime, 'HH:mm'));
      
      setIsEditMode(true);
    } else if (userEntities.length > 0) {
      // Set default entity to first user entity
      setEntityId(userEntities[0].id);
    }
    
    setIsDialogOpen(true);
  };
  
  const handleFindAvailableVenues = async () => {
    if (!startDate || !startTime || !endDate || !endTime) {
      toast({
        title: 'Error',
        description: 'Please select start and end date/time',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSearchingVenues(true);
      
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error('Invalid date or time format');
      }
      
      if (startDateTime >= endDateTime) {
        throw new Error('End time must be after start time');
      }
      
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
      
      // Call API to get available venues
      const response = await fetch(`/api/venues/available?start=${startDateTime.toISOString()}&end=${endDateTime.toISOString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch available venues');
      }
      
      const availableVenuesData = await response.json();
      setAvailableVenues(availableVenuesData);
      setShowAvailableVenues(true);
      
      if (availableVenuesData.length === 0) {
        toast({
          title: 'No venues available',
          description: 'No venues are available during the selected time period',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSearchingVenues(false);
    }
  };
  
  const handleCreateBooking = async () => {
    try {
      if (!venueId || !title || !startDate || !startTime || !endDate || !endTime) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }
      
      // Check if user has any entities
      if (userEntities.length === 0) {
        toast({
          title: 'Error',
          description: 'You need to be part of an entity to make bookings',
          variant: 'destructive',
        });
        return;
      }
      
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
      
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error('Invalid date or time format');
      }
      
      if (startDateTime >= endDateTime) {
        throw new Error('End time must be after start time');
      }
  
      // Use the first entity from userEntities
      const userEntityId = userEntities[0].id;
  
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          venue_id: venueId,
          entity_id: userEntityId,
          title,
          description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString()
        })
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create booking');
      }

      // Update bookings list with the new booking
      setBookings([data, ...bookings]);
      
      toast({
        title: 'Success',
        description: 'Booking request submitted successfully',
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

  const handleUpdateBooking = async () => {
    try {
      if (!selectedBooking) return;
      
      if (!title || !startDate || !startTime || !endDate || !endTime) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }
      
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
      
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error('Invalid date or time format');
      }
      
      if (startDateTime >= endDateTime) {
        throw new Error('End time must be after start time');
      }
  
      const response = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString()
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update booking');
      }

      // Update bookings list
      setBookings(bookings.map(booking => booking.id === selectedBooking.id ? data : booking));
      
      toast({
        title: 'Success',
        description: 'Booking updated successfully',
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

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to cancel booking');
      }

      // Update bookings list
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled' } 
          : booking
      ));
      
      toast({
        title: 'Success',
        description: 'Booking cancelled successfully',
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Venue Bookings</h1>
        <Button onClick={() => handleOpenDialog()}>Request New Booking</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading...</p>}
          
          {!isLoading && bookings.length === 0 && (
            <p>No bookings found. Create one to get started.</p>
          )}
          
          {!isLoading && bookings.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venue</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.venue.name}</TableCell>
                    <TableCell>{booking.title}</TableCell>
                    <TableCell>{booking.entity.name}</TableCell>
                    <TableCell>
                      {format(new Date(booking.start_time), 'MMM d, yyyy h:mm a')} - 
                      {format(new Date(booking.end_time), 'h:mm a')}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {booking.status === 'pending' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleOpenDialog(booking)}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
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
            <DialogTitle>{isEditMode ? 'Edit Booking' : 'Request New Booking'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Update the details of this booking request.' 
                : 'Fill in the details to request a new venue booking.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                placeholder="Event title"
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
                placeholder="Event description"
              />
            </div>
            
            {!isEditMode && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="venue" className="text-right">
                  Venue
                </Label>
                <select
                  id="venue"
                  value={venueId}
                  onChange={(e) => setVenueId(e.target.value ? parseInt(e.target.value) : '')}
                  className="col-span-3 p-2 border rounded"
                >
                  <option value="">Select Venue</option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name} {venue.address ? `(${venue.address})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setShowAvailableVenues(false);
                }}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                Start Time
              </Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setShowAvailableVenues(false);
                }}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setShowAvailableVenues(false);
                }}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">
                End Time
              </Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setShowAvailableVenues(false);
                }}
                className="col-span-3"
              />
            </div>
            
            {!isEditMode && (
              <>
                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={handleFindAvailableVenues}
                    disabled={!startDate || !startTime || !endDate || !endTime || isSearchingVenues}
                    className="mt-2"
                  >
                    {isSearchingVenues ? 'Searching...' : 'Find Available Venues'}
                  </Button>
                </div>
                
                {showAvailableVenues && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="venue" className="text-right">
                      Available Venues
                    </Label>
                    <select
                      id="venue"
                      value={venueId}
                      onChange={(e) => setVenueId(e.target.value ? parseInt(e.target.value) : '')}
                      className="col-span-3 p-2 border rounded"
                    >
                      <option value="">Select Venue</option>
                      {availableVenues.length > 0 ? (
                        availableVenues.map((venue) => (
                          <option key={venue.id} value={venue.id}>
                            {venue.name} {venue.address ? `(${venue.address})` : ''}
                            {venue.capacity ? ` - Capacity: ${venue.capacity}` : ''}
                          </option>
                        ))
                      ) : (
                        <option disabled>No venues available for selected time</option>
                      )}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={isEditMode ? handleUpdateBooking : handleCreateBooking}
              disabled={!title || (!isEditMode && (!showAvailableVenues || !venueId)) || !startDate || !startTime || !endDate || !endTime}
            >
              {isEditMode ? 'Update' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}