"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { VenueRequestCard } from "./venue-request-card"
import { useToast } from "@/components/ui/use-toast"

interface VenueRequest {
  id: string
  name: string
  event: string
  venue: string
  startDate: string
  endDate: string
  applicationType?: string
  applicationDate?: string
  approvalStatus: {
    submitted: boolean
    studentCouncil: boolean
    facultyAdvisor: boolean
    swo: boolean
    security: boolean
  }
  studentCouncilPresident?: string
}

export function VenueRequestList() {
  const [filter, setFilter] = useState("active")
  const [role, setRole] = useState("")
  const [requests, setRequests] = useState<VenueRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { data: session } = useSession()
  const { toast } = useToast()

  // Fetch venue requests
  const fetchRequests = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `/api/venue-requests?status=${filter}&role=${role}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch requests')
      }
      const data = await response.json()
      setRequests(data)
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast({
        title: "Error",
        description: "Failed to fetch venue requests",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Initialize role from session
  useEffect(() => {
    if (session?.user?.role) {
      setRole(session.user.role)
    }
  }, [session])

  // Fetch requests when filter or role changes
  useEffect(() => {
    fetchRequests()
  }, [filter, role])

  const handleApprove = async (requestId: string) => {
    try {
      const response = await fetch(`/api/venue-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to approve request')
      }

      toast({
        title: "Success",
        description: "Request approved successfully",
      })

      // Refresh the requests list
      fetchRequests()
    } catch (error) {
      console.error('Error approving request:', error)
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      const response = await fetch(`/api/venue-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to reject request')
      }

      toast({
        title: "Success",
        description: "Request rejected successfully",
      })

      // Refresh the requests list
      fetchRequests()
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      })
    }
  }

  const handleDetails = (requestId: string) => {
    // Handle view details logic - could navigate to a details page
    console.log("Viewing details:", requestId)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Venue Requests</h1>
        <div className="flex items-center gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SC">Student Council</SelectItem>
              <SelectItem value="FA">Faculty Advisor</SelectItem>
              <SelectItem value="SWO">Student Welfare Office</SelectItem>
              <SelectItem value="SECURITY">Security</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No venue requests found
          </div>
        ) : (
          requests.map((request) => (
            <VenueRequestCard
              key={request.id}
              request={request}
              onApprove={handleApprove}
              onReject={handleReject}
              onDetails={handleDetails}
            />
          ))
        )}
      </div>
    </div>
  )
} 