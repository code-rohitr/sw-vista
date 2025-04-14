"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProposalCard } from "./proposal-card"
import { NewProposalForm } from "./new-proposal-form"
import { Plus } from "lucide-react"

interface Proposal {
  id: number
  proposer_id: number
  title: string
  description: string
  event_type: string
  requested_date: string
  status: string
  created_at: string
  proposer: {
    username: string
    email: string
  }
}

export function ClubProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [isNewProposalOpen, setIsNewProposalOpen] = useState(false)

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const response = await fetch("/api/proposals/club")
        if (!response.ok) {
          throw new Error("Failed to fetch proposals")
        }
        const data = await response.json()
        setProposals(data)
      } catch (error) {
        console.error("Error fetching proposals:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProposals()
  }, [])

  const activeProposals = proposals.filter((proposal) => 
    proposal.status === "Under Review" || proposal.status === "Pending"
  )
  const historyProposals = proposals.filter(
    (proposal) => proposal.status === "Approved" || proposal.status === "Rejected"
  )

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Event Proposals</h2>
        <Button className="border-2 hover:bg-gray-200" onClick={() => setIsNewProposalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Proposal
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Proposals ({activeProposals.length})</TabsTrigger>
          <TabsTrigger value="history">History ({historyProposals.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-4">
          {activeProposals.length === 0 ? (
            <div className="text-center text-muted-foreground">No active proposals</div>
          ) : (
            activeProposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))
          )}
        </TabsContent>
        <TabsContent value="history" className="space-y-4">
          {historyProposals.length === 0 ? (
            <div className="text-center text-muted-foreground">No historical proposals</div>
          ) : (
            historyProposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))
          )}
        </TabsContent>
      </Tabs>

      <NewProposalForm isOpen={isNewProposalOpen} onClose={() => setIsNewProposalOpen(false)} />
    </div>
  )
} 