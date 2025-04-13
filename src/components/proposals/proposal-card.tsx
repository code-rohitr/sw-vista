"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

interface Proposal {
  id: number
  title: string
  description: string | null
  event_type: string
  requested_date: Date
  status: string
  created_at: Date
  proposer: {
    username: string
    email: string
  }
}

interface ProposalCardProps {
  proposal: Proposal
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleApprove = async () => {
    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/proposals/${proposal.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment }),
      })

      if (!response.ok) {
        throw new Error("Failed to approve proposal")
      }

      toast({
        title: "Success",
        description: "Proposal approved successfully",
      })
      
      // Refresh the page to show updated status
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve proposal",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/proposals/${proposal.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment }),
      })

      if (!response.ok) {
        throw new Error("Failed to reject proposal")
      }

      toast({
        title: "Success",
        description: "Proposal rejected successfully",
      })
      
      // Refresh the page to show updated status
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject proposal",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{proposal.title}</CardTitle>
        <div className="text-sm text-gray-500">
          Submitted by {proposal.proposer.username} ({proposal.proposer.email})
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Description</h3>
            <p className="text-sm text-gray-600">{proposal.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Event Type</h3>
              <p className="text-sm text-gray-600">{proposal.event_type}</p>
            </div>
            <div>
              <h3 className="font-medium">Requested Date</h3>
              <p className="text-sm text-gray-600">
                {format(new Date(proposal.requested_date), "PPP")}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-medium">Status</h3>
            <p className="text-sm text-gray-600">{proposal.status}</p>
          </div>

          <div>
            <h3 className="font-medium">Comments</h3>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add your comments here..."
              className="mt-2"
            />
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleApprove}
              disabled={isSubmitting || !comment || proposal.status === "Approved"}
              variant="default"
            >
              Approve
            </Button>
            <Button
              onClick={handleReject}
              disabled={isSubmitting || !comment || proposal.status === "Rejected"}
              variant="destructive"
            >
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 