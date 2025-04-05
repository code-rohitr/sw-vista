'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Venue {
  id: string;
  name: string;
  capacity: number;
  amenities: string | null;
}

interface Entity {
  id: string;
  name: string;
}

interface User {
  id: string;
  username: string;
}

interface Approval {
  id: string;
  status: string;
  comments: string | null;
  created_at: string;
  approver: User;
}

interface VenueBooking {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  status: string;
  venue: Venue;
  entity: Entity;
  creator: User;
  approvals: Approval[];
}

export default function VenueBookingsPage() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<VenueBooking[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<VenueBooking | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue_id: '',
    entity_id: '',
    start_time: '',
    end_time: '',
  });
  const [approvalData, setApprovalData] = useState({
    action: '',
    comment: '',
  });

  // Fetch bookings, venues, and entities
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [bookingsRes, venuesRes, entitiesRes] = await Promise.all([
          fetch('/api/venue-bookings'),
          fetch('/api/venues'),
          fetch('/api/entities'),
        ]);

        if (!bookingsRes.ok || !venuesRes.ok || !entitiesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [bookingsData, venuesData, entitiesData] = await Promise.all([
          bookingsRes.json(),
          venuesRes.json(),
          entitiesRes.json(),
        ]);

        setBookings(bookingsData);
        setVenues(venuesData);
        setEntities(entitiesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle select input changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle approval input changes
  const handleApprovalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setApprovalData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle approval select changes
  const handleApprovalSelectChange = (name: string, value: string) => {
    setApprovalData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/venue-bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const newBooking = await response.json();
      setBookings((prev) => [...prev, newBooking]);
      setIsDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        venue_id: '',
        entity_id: '',
        start_time: '',
        end_time: '',
      });
      toast({
        title: 'Success',
        description: 'Venue booking created successfully',
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create booking',
        variant: 'destructive',
      });
    }
  };

  // Handle approval submission
  const handleApprovalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    try {
      const response = await fetch(`/api/venue-bookings/${selectedBooking.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process approval');
      }

      const updatedApproval = await response.json();
      
      // Update the booking in the state
      setBookings((prev) => 
        prev.map((booking) => 
          booking.id === selectedBooking.id
            ? {
                ...booking,
                approvals: booking.approvals.map((approval) =>
                  approval.id === updatedApproval.id ? updatedApproval : approval
                ),
                status: updatedApproval.status === 'approved' 
                  ? booking.approvals.every(a => a.status === 'approved' || a.id === updatedApproval.id) 
                    ? 'approved' 
                    : booking.status
                  : 'rejected'
              }
            : booking
        )
      );

      setIsApprovalDialogOpen(false);
      setApprovalData({
        action: '',
        comment: '',
      });
      toast({
        title: 'Success',
        description: `Booking ${approvalData.action}ed successfully`,
      });
    } catch (error) {
      console.error('Error processing approval:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process approval',
        variant: 'destructive',
      });
    }
  };

  // Handle opening the approval dialog
  const handleOpenApprovalDialog = (booking: VenueBooking) => {
    setSelectedBooking(booking);
    setIsApprovalDialogOpen(true);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  // Check if user is an approver for this booking
  const isUserApprover = (booking: VenueBooking) => {
    // This would be replaced with the actual user ID from your auth context
    const currentUserId = 'current-user-id'; // Replace with actual user ID
    return booking.approvals.some(approval => approval.approver.id === currentUserId);
  };

  // Get user's approval status for this booking
  const getUserApprovalStatus = (booking: VenueBooking) => {
    // This would be replaced with the actual user ID from your auth context
    const currentUserId = 'current-user-id'; // Replace with actual user ID
    const userApproval = booking.approvals.find(approval => approval.approver.id === currentUserId);
    return userApproval ? userApproval.status : null;
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Venue Bookings</h1>
        <Button onClick={() => setIsDialogOpen(true)}>Create Booking</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approvals</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.title}</TableCell>
                <TableCell>{booking.venue.name}</TableCell>
                <TableCell>{booking.entity.name}</TableCell>
                <TableCell>{formatDate(booking.start_time)}</TableCell>
                <TableCell>{formatDate(booking.end_time)}</TableCell>
                <TableCell>{getStatusBadge(booking.status)}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {booking.approvals.map((approval) => (
                      <div key={approval.id} className="flex items-center gap-1">
                        {approval.status === 'approved' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : approval.status === 'rejected' ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-sm">
                          {approval.approver.username}
                        </span>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {isUserApprover(booking) && getUserApprovalStatus(booking) === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenApprovalDialog(booking)}
                    >
                      Approve/Reject
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create Booking Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Venue Booking</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new venue booking.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="venue_id" className="text-right">
                  Venue
                </Label>
                <Select
                  value={formData.venue_id}
                  onValueChange={(value) => handleSelectChange('venue_id', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="entity_id" className="text-right">
                  Entity
                </Label>
                <Select
                  value={formData.entity_id}
                  onValueChange={(value) => handleSelectChange('entity_id', value)}
                >
                  <SelectTrigger className="col-span-3">
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
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start_time" className="text-right">
                  Start Time
                </Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="end_time" className="text-right">
                  End Time
                </Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Create Booking</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Process Booking Approval</DialogTitle>
            <DialogDescription>
              {selectedBooking && (
                <div className="mt-2">
                  <p><strong>Booking:</strong> {selectedBooking.title}</p>
                  <p><strong>Venue:</strong> {selectedBooking.venue.name}</p>
                  <p><strong>Date:</strong> {formatDate(selectedBooking.start_time)} - {formatDate(selectedBooking.end_time)}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApprovalSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="action" className="text-right">
                  Action
                </Label>
                <Select
                  value={approvalData.action}
                  onValueChange={(value) => handleApprovalSelectChange('action', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select an action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="comment" className="text-right">
                  Comment
                </Label>
                <Textarea
                  id="comment"
                  name="comment"
                  value={approvalData.comment}
                  onChange={handleApprovalInputChange}
                  className="col-span-3"
                  placeholder="Add a comment (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!approvalData.action}>
                Submit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 