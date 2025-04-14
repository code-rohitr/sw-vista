import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { ClubHeader } from "@/components/clubs/club-header"

async function getClubDetails(id: string) {
  try {
    const club = await prisma.club.findUnique({
      where: { id: parseInt(id) },
      include: {
        members: {
          include: {
            user: {
              select: {
                username: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    })
    return club
  } catch (error) {
    console.error('Error fetching club details:', error)
    return null
  }
}

export default async function ClubDetailsPage({
  params
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  const club = await getClubDetails(params.id)

  if (!club) {
    redirect('/clubs')
  }

  const president = club.members.find(member => member.role === 'President')
  const facultyAdvisor = club.members.find(member => member.user.role === 'FA')
  
  // Check if user has edit permissions
  const canEdit = session.user?.role === 'admin' || 
                 session.user?.role === 'SWO' || 
                 session.user?.role === 'SC' ||
                 session.user?.role === 'FA' ||
                 session.user?.role === 'SECURITY' ||
                 (president?.user.email === session.user?.email)

  return (
    <div className="container mx-auto py-8">
      <ClubHeader clubName={club.name} canEdit={canEdit} />

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="prose max-w-none">
          <p className="text-gray-600 mb-8">{club.description}</p>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">Faculty Advisor</h3>
              <p>{facultyAdvisor ? facultyAdvisor.user.username : 'Not assigned'}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">President</h3>
              <p>{president ? president.user.username : 'Not assigned'}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Details Last Updated</h3>
              <p>{format(club.created_at, 'MM/dd/yyyy')}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Club Type</h3>
              <p>Technical</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Members</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {club.members
                .filter(member => member.role !== 'President' && member.user.role !== 'FA')
                .map((member) => (
                  <div
                    key={member.id}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <p className="font-medium">{member.user.username}</p>
                    <p className="text-sm text-gray-500">{member.role}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 