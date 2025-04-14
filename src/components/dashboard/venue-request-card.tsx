"use client"

import { format } from "date-fns"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ApprovalProgress } from "./approval-progress"
import { cn } from "@/lib/utils"
import { Check, X, Clock } from "lucide-react"
import React, { useState } from "react"
import { BookingDetails } from "./booking-details"
import { useSession } from "next-auth/react"

interface VenueRequestCardProps {
  request: {
    id: string
    name: string
    event: string
    venue: string
    startDate: Date
    endDate: Date
    applicationType?: string
    applicationDate?: string
    status: number
    studentCouncilPresident?: string
  }
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

export function VenueRequestCard({
  request,
  onApprove,
  onReject,
}: VenueRequestCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [bookingDetails, setBookingDetails] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession()

  // Helper function to determine if the current user can approve/reject
  const canShowActions = () => {
    if (!session?.user?.role) return false

    switch (session.user.role) {
      case 'FA':
        return request.status === 1 // Show for FA when status is Submitted
      case 'SC':
        return request.status === 2 // Show for SC when FA approved
      case 'SWO':
        return request.status === 3 // Show for SWO when SC approved
      case 'SECURITY':
        return request.status === 4 // Show for Security when SWO approved
      default:
        return false
    }
  }

  // Helper function to determine status display based on numeric status
  const getStatusDisplay = (status: number) => {
    const steps = [
      { label: "Submitted", status: "pending" },
      { label: "Faculty Advisor", status: "pending" },
      { label: "Student Council", status: "pending" },
      { label: "SWO", status: "pending" },
      { label: "Security", status: "pending" }
    ];

    // Mark steps as approved based on the status number
    for (let i = 0; i < status && i < steps.length; i++) {
      steps[i].status = "approved";
    }

    // If status is 0, it means rejected at submission
    if (status === 0) {
      return [
        { label: "Submitted", status: "approved" },
        { label: "Rejected", status: "rejected" }
      ];
    }

    return steps;
  };

  const handleDetailsClick = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/venue-requests/${request.id}`)
      if (!response.ok) throw new Error('Failed to fetch booking details')
      const data = await response.json()
      setBookingDetails(data)
      setShowDetails(true)
    } catch (error) {
      console.error('Error fetching booking details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const statusSteps = getStatusDisplay(request.status);

  return (
    <>
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{request.name}</CardTitle>
          <CardDescription>{request.event}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Venue</p>
                <p>{request.venue}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Application Date
                </p>
                <p>{request.applicationDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Start Date & Time
                </p>
                <p>{format(new Date(request.startDate), "PPP p")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">End Date & Time</p>
                <p>{format(new Date(request.endDate), "PPP p")}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Approval Status
              </p>
              <div className="flex items-center space-x-4">
                {statusSteps.map((step, index) => (
                  <React.Fragment key={step.label}>
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          {
                            "bg-green-500 text-white": step.status === "approved",
                            "bg-red-500 text-white": step.status === "rejected",
                            "bg-gray-200": step.status === "pending",
                          }
                        )}
                      >
                        {step.status === "approved" && <Check className="h-5 w-5" />}
                        {step.status === "rejected" && <X className="h-5 w-5" />}
                        {step.status === "pending" && (
                          <Clock className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <p className="text-xs mt-1">{step.label}</p>
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className="flex-1 h-px bg-gray-200" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {request.applicationType && (
                <Badge variant="secondary">{request.applicationType}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {canShowActions() && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReject(request.id)}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onApprove(request.id)}
                  >
                    Approve
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDetailsClick}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Details"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <BookingDetails
        booking={bookingDetails}
        open={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </>
  )
} 