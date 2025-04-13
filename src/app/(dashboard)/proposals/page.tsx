import { prisma } from "@/lib/prisma"
import { ProposalCard } from "@/components/proposals/proposal-card"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

async function getProposals() {
  try {
    const proposals = await prisma.proposal.findMany({
      include: {
        proposer: {
          select: {
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })
    return proposals
  } catch (error) {
    console.error('Error fetching proposals:', error)
    return []
  }
}

export default async function ProposalsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  // Allow both SWO and admin to access this page
  if (session.user?.role !== 'SWO' && session.user?.role !== 'admin') {
    redirect('/dashboard')
  }

  const proposals = await getProposals()

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Proposal Requests</h1>
      </div>
      
      <div className="grid gap-6">
        {proposals.length === 0 ? (
          <p className="text-gray-500 text-center">No proposals found</p>
        ) : (
          proposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))
        )}
      </div>
    </div>
  )
} 