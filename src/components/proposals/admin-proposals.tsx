"use client"

import { ProposalCard } from "@/components/proposals/proposal-card"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Proposal {
  id: number
  title: string
  description: string | null
  event_type: string
  requested_date: Date
  status: string
  created_at: Date
  comments?: string | null
  proposer: {
    username: string
    email: string
  }
}

export function AdminProposals() {
  const { data: session } = useSession()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/proposals')
        if (!response.ok) throw new Error('Failed to fetch proposals')
        const data = await response.json()
        setProposals(data)
      } catch (error) {
        console.error('Error fetching proposals:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProposals()
  }, [])

  const activeProposals = proposals.filter(p => p.status === "Pending")
  const historyProposals = proposals.filter(p => p.status === "Approved" || p.status === "Rejected")

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Proposal Requests</h1>
      </div>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active">
            Active Proposals ({activeProposals.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            History ({historyProposals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : activeProposals.length === 0 ? (
              <p className="text-gray-500 text-center">No active proposals found</p>
            ) : (
              activeProposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : historyProposals.length === 0 ? (
              <p className="text-gray-500 text-center">No past proposals found</p>
            ) : (
              historyProposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 