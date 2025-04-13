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

  // Allow both SWO, admin, and club to access this page
  if (session.user?.role !== 'SWO' && session.user?.role !== 'admin' && session.user?.role !== 'club') {
    redirect('/dashboard')
  }

  const isAdmin = session.user?.role === 'SWO' || session.user?.role === 'admin'

  return isAdmin ? <AdminProposals /> : <ClubProposals />
} 