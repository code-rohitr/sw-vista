import { VenueRequestList } from "@/components/dashboard/venue-request-list"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function BookingsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  // Allow both SWO and admin to access this page
  if (session.user?.role !== 'SWO' && session.user?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Venue Bookings</h1>
      </div>
      <VenueRequestList />
    </div>
  )
} 