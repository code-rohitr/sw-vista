import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(session.user)
    // Allow SWO, admin, and club roles to access proposals
    if (session.user?.role !== "SWO" && session.user?.role !== "admin" && session.user?.role !== "CLUB") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch all proposals with proposer information
    const proposals = await prisma.proposal.findMany({
      include: {
        proposer: {
          select: {
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    return NextResponse.json(proposals)
  } catch (error) {
    console.error("Error fetching proposals:", error)
    return NextResponse.json(
      { error: "Failed to fetch proposals" },
      { status: 500 }
    )
  }
} 