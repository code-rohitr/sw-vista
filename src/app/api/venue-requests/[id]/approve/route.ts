import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookingId = parseInt(params.id)
    const userId = parseInt(session.user.id)
    const userRole = session.user.role

    // Get the current booking
    const booking = await prisma.venueBooking.findUnique({
      where: { id: bookingId },
      include: {
        approvals: {
          include: {
            approver: {
              select: {
                role: true
              }
            }
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if user has already approved
    const hasApproved = booking.approvals.some(
      a => a.approver_id === userId && a.action === 'approved'
    )
    if (hasApproved) {
      return NextResponse.json(
        { error: 'Already approved this request' },
        { status: 400 }
      )
    }

    // Determine the next status based on current approvals
    let newStatus = booking.status
    const hasFA = booking.approvals.some(a => a.approver.role === 'FA' && a.action === 'approved')
    const hasSC = booking.approvals.some(a => a.approver.role === 'SC' && a.action === 'approved')
    const hasSWO = booking.approvals.some(a => a.approver.role === 'SWO' && a.action === 'approved')
    const hasSecurity = booking.approvals.some(a => a.approver.role === 'SECURITY' && a.action === 'approved')

    if (userRole === 'FA' && !hasFA) {
      newStatus = 'Pending SC Approval'
    } else if (userRole === 'SC' && !hasSC) {
      newStatus = 'Pending SWO Approval'
    } else if (userRole === 'SWO' && !hasSWO) {
      newStatus = 'Pending Security Approval'
    } else if (userRole === 'SECURITY' && !hasSecurity) {
      newStatus = 'Approved'
    }

    // Create approval record and update booking status
    await prisma.$transaction([
      prisma.approval.create({
        data: {
          approver_id: userId,
          entity_type: 'booking',
          entity_id: bookingId,
          action: 'approved',
          remarks: `Approved by ${userRole}`
        }
      }),
      prisma.venueBooking.update({
        where: { id: bookingId },
        data: { status: newStatus }
      })
    ])

    return NextResponse.json({ status: 'success', newStatus })
  } catch (error) {
    console.error('Error approving venue request:', error)
    return NextResponse.json(
      { error: 'Failed to approve venue request' },
      { status: 500 }
    )
  }
} 