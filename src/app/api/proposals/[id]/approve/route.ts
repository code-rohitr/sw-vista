import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Allow both SWO and admin to approve proposals
    if (session.user?.role !== "SWO" && session.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { comment } = await request.json()
    const proposalId = parseInt(params.id)

    // Create approval record and update proposal status
    await prisma.$transaction([
      prisma.approval.create({
        data: {
          approver_id: parseInt(session.user.id),
          entity_type: "proposal",
          entity_id: proposalId,
          action: "approved",
          remarks: comment,
        },
      }),
      prisma.proposal.update({
        where: { id: proposalId },
        data: { status: "Approved" },
      }),
    ])

    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("Error approving proposal:", error)
    return NextResponse.json(
      { error: "Failed to approve proposal" },
      { status: 500 }
    )
  }
} 