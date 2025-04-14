import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import VenuesClient from "./venues-client"

export default async function VenuesPage() {
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

  return <VenuesClient />
} 