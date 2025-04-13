import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (session.user?.role !== 'club') {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Fetch proposals for the current club
    const proposals = await prisma.proposal.findMany({
      where: {
        proposer_id: Number(session.user.id) // Convert string ID to number
      },
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

    return NextResponse.json(proposals)
  } catch (error) {
    console.error('[PROPOSALS_GET]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (session.user?.role !== 'club') {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await request.json()
    const { title, description, event_type, requested_date } = body

    if (!title || !description || !event_type || !requested_date) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const proposal = await prisma.proposal.create({
      data: {
        title,
        description,
        event_type,
        requested_date: new Date(requested_date),
        status: "Pending",
        proposer_id: Number(session.user.id),
      },
    })

    return NextResponse.json(proposal)
  } catch (error) {
    console.error('[PROPOSALS_POST]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 