import { prisma } from "@/lib/prisma"
import { ClubCard } from "@/components/clubs/club-card"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

async function getClubs() {
  try {
    const clubs = await prisma.club.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                username: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    return clubs
  } catch (error) {
    console.error('Error fetching clubs:', error)
    return []
  }
}

export default async function ClubsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  const clubs = await getClubs()

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">All Clubs</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.length === 0 ? (
          <p className="text-gray-500 text-center col-span-3">No clubs found</p>
        ) : (
          clubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))
        )}
      </div>
    </div>
  )
} 