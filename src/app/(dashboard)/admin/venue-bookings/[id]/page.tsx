'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle, XCircle, Clock, Calendar, MapPin, Building, User } from 'lucide-react';

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
  processed_at: string | null;
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
  created_at: string;
  updated_at: string;
}

export default function VenueBookingDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<VenueBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalData, setApprovalData] = useState({
    action: '',
    comment: '',
  });

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/venue-bookings/${params.id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch booking details');
        }

        const bookingData = await response.json();
        setBooking(bookingData);
      } catch (error) {
        console.error('Error fetching booking details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load booking details. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchBooking();
    }
  }, [params.id, toast]);

  // Handle approval input changes
  const handleApprovalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setApprovalData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle approval select changes
  const handleApprovalSelectChange = (name: string, value: string) => {
    setApprovalData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle approval submission
  const handleApprovalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    try {
      const response = await fetch(`/api/venue-bookings/${booking.id}/approve`, {
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
      setBooking((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          approvals: prev.approvals.map((approval) =>
            approval.id === updatedApproval.id ? updatedApproval : approval
          ),
          status: updatedApproval.status === 'approved' 
            ? prev.approvals.every(a => a.status === 'approved' || a.id === updatedApproval.id) 
              ? 'approved' 
              : prev.status
            : 'rejected'
        };
      });

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
  const isUserApprover = () => {
    if (!booking) return false;
    // This would be replaced with the actual user ID from your auth context
    const currentUserId = 'current-user-id'; // Replace with actual user ID
    return booking.approvals.some(approval => approval.approver.id === currentUserId);
  };

  // Get user's approval status for this booking
  const getUserApprovalStatus = () => {
    if (!booking) return null;
    // This would be replaced with the actual user ID from your auth context
    const currentUserId = 'current-user-id'; // Replace with actual user ID
    const userApproval = booking.approvals.find(approval => approval.approver.id === currentUserId);
    return userApproval ? userApproval.status : null;
  };

  // Get approval status icon
  const getApprovalStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-2xl font-bold mb-4">Booking Not Found</h2>
          <Button onClick={() => router.push('/admin/venue-bookings')}>
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/venue-bookings')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bookings
        </Button>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{booking.title}</h1>
          {isUserApprover() && getUserApprovalStatus() === 'pending' && (
            <Button onClick={() => setIsApprovalDialogOpen(true)}>
              Process Approval
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
              <CardDescription>
                Created on {formatDate(booking.created_at)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 mr-2 mt-0.5 text-gray-500" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p>{formatDate(booking.start_time)} - {formatDate(booking.end_time)}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-2 mt-0.5 text-gray-500" />
                  <div>
                    <p className="font-medium">Venue</p>
                    <p>{booking.venue.name}</p>
                    <p className="text-sm text-gray-500">Capacity: {booking.venue.capacity}</p>
                    {booking.venue.amenities && (
                      <p className="text-sm text-gray-500">Amenities: {booking.venue.amenities}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start">
                  <Building className="h-5 w-5 mr-2 mt-0.5 text-gray-500" />
                  <div>
                    <p className="font-medium">Entity</p>
                    <p>{booking.entity.name}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <User className="h-5 w-5 mr-2 mt-0.5 text-gray-500" />
                  <div>
                    <p className="font-medium">Created By</p>
                    <p>{booking.creator.username}</p>
                  </div>
                </div>
                {booking.description && (
                  <div>
                    <p className="font-medium">Description</p>
                    <p className="whitespace-pre-wrap">{booking.description}</p>
                  </div>
                )}
                <div>
                  <p className="font-medium">Status</p>
                  {getStatusBadge(booking.status)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Approval Status</CardTitle>
              <CardDescription>
                {booking.approvals.length} approver{booking.approvals.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {booking.approvals.map((approval) => (
                  <div key={approval.id} className="flex items-start">
                    <div className="mr-3 mt-1">
                      {getApprovalStatusIcon(approval.status)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{approval.approver.username}</p>
                      <p className="text-sm text-gray-500">
                        {approval.status === 'pending' 
                          ? 'Pending approval' 
                          : `${approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}ed on ${formatDate(approval.processed_at || approval.created_at)}`}
                      </p>
                      {approval.comments && (
                        <p className="text-sm mt-1 italic">"{approval.comments}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approval Dialog */}
      {isApprovalDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Process Booking Approval</h2>
            <div className="mb-4">
              <p><strong>Booking:</strong> {booking.title}</p>
              <p><strong>Venue:</strong> {booking.venue.name}</p>
              <p><strong>Date:</strong> {formatDate(booking.start_time)} - {formatDate(booking.end_time)}</p>
            </div>
            <form onSubmit={handleApprovalSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Action</label>
                <select
                  className="w-full p-2 border rounded"
                  value={approvalData.action}
                  onChange={(e) => handleApprovalSelectChange('action', e.target.value)}
                  required
                >
                  <option value="">Select an action</option>
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Comment</label>
                <textarea
                  className="w-full p-2 border rounded"
                  name="comment"
                  value={approvalData.comment}
                  onChange={handleApprovalInputChange}
                  placeholder="Add a comment (optional)"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsApprovalDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!approvalData.action}>
                  Submit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 