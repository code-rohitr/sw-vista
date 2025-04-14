import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { ClubProposals } from "@/components/proposals/club-proposals"
import { AdminProposals } from "@/components/proposals/admin-proposals"

export default async function ProposalsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  // Allow SWO, admin, club, SC, FA, and SECURITY to access this page
  if (session.user?.role !== 'SWO' && 
      session.user?.role !== 'admin' && 
      session.user?.role !== 'CLUB' && 
      session.user?.role !== 'SC' && 
      session.user?.role !== 'FA' && 
      session.user?.role !== 'SECURITY') {
    redirect('/dashboard')
  }

  // Show admin view for SWO, admin, SC, FA, and SECURITY
  // Show club view for club role
  const isAdmin = session.user?.role === 'SWO' || 
                 session.user?.role === 'admin' || 
                 session.user?.role === 'SC' || 
                 session.user?.role === 'FA' || 
                 session.user?.role === 'SECURITY'

  return isAdmin ? <AdminProposals /> : <ClubProposals />
} 