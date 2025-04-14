import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Create user roles
  const roles = [
    {
      role_name: 'SWO',
      permissions: 'approve_bookings,view_all_bookings,generate_reports,manage_users'
    },
    {
      role_name: 'FA',
      permissions: 'approve_bookings,view_all_bookings,manage_users'
    },
    {
      role_name: 'SC',
      permissions: 'approve_bookings,view_all_bookings'
    },
    {
      role_name: 'SECURITY',
      permissions: 'approve_bookings,view_all_bookings'
    },
    {
      role_name: 'CLUB',
      permissions: 'book_venues,manage_club_members,view_club_bookings'
    }
  ]

  console.log('Creating user roles...')
  const createdRoles = await Promise.all(
    roles.map(role => prisma.userRole.create({ data: role }))
  )

  // Create users
  const defaultPassword = await bcrypt.hash('password123', 10)
  
  const users = [
    // Administrative users
    {
      username: 'swo_admin',
      email: 'swo@university.edu',
      password_hash: defaultPassword,
      role: 'SWO'
    },
    {
      username: 'faculty_advisor',
      email: 'fa@university.edu',
      password_hash: defaultPassword,
      role: 'FA'
    },
    {
      username: 'student_council',
      email: 'sc@university.edu',
      password_hash: defaultPassword,
      role: 'SC'
    },
    {
      username: 'security_admin',
      email: 'security@university.edu',
      password_hash: defaultPassword,
      role: 'SECURITY'
    },
    // Club presidents
    {
      username: 'cs_president',
      email: 'cs_pres@university.edu',
      password_hash: defaultPassword,
      role: 'CLUB'
    },
    {
      username: 'debate_president',
      email: 'debate_pres@university.edu',
      password_hash: defaultPassword,
      role: 'CLUB'
    },
    {
      username: 'music_president',
      email: 'music_pres@university.edu',
      password_hash: defaultPassword,
      role: 'CLUB'
    },
    {
      username: 'sports_president',
      email: 'sports_pres@university.edu',
      password_hash: defaultPassword,
      role: 'CLUB'
    },
    {
      username: 'art_president',
      email: 'art_pres@university.edu',
      password_hash: defaultPassword,
      role: 'CLUB'
    }
  ]

  console.log('Creating users...')
  const createdUsers = await Promise.all(
    users.map(user => prisma.user.create({ data: user }))
  )

  // Create venues
  const venues = [
    {
      name: 'AB1 R5006',
      location: 'Academic Block 1',
      capacity: 50,
      description: 'Medium-sized classroom with projector and whiteboard',
      image_url: 'https://example.com/venues/ab1_r5006.jpg'
    },
    {
      name: 'AB1 R3002',
      location: 'Academic Block 1',
      capacity: 100,
      description: 'Large lecture hall with tiered seating',
      image_url: 'https://example.com/venues/ab1_r3002.jpg'
    },
    {
      name: 'AB2 R2005',
      location: 'Academic Block 2',
      capacity: 30,
      description: 'Small seminar room with round table setup',
      image_url: 'https://example.com/venues/ab2_r2005.jpg'
    },
    {
      name: 'AB3 R1001',
      location: 'Academic Block 3',
      capacity: 200,
      description: 'Auditorium with stage and professional AV equipment',
      image_url: 'https://example.com/venues/ab3_r1001.jpg'
    },
    {
      name: 'AB4 R4008',
      location: 'Academic Block 4',
      capacity: 25,
      description: 'Discussion room with flexible seating arrangement',
      image_url: 'https://example.com/venues/ab4_r4008.jpg'
    },
    {
      name: 'AB5 R103',
      location: 'Academic Block 5',
      capacity: 40,
      description: 'Computer lab with 40 workstations',
      image_url: 'https://example.com/venues/ab5_r103.jpg'
    },
    {
      name: 'SS R001',
      location: 'Student Services Building',
      capacity: 150,
      description: 'Multi-purpose hall with stage',
      image_url: 'https://example.com/venues/ss_r001.jpg'
    },
    {
      name: 'LIB R201',
      location: 'Library Building',
      capacity: 60,
      description: 'Conference room with presentation facilities',
      image_url: 'https://example.com/venues/lib_r201.jpg'
    },
    {
      name: 'SPO G001',
      location: 'Sports Complex',
      capacity: 300,
      description: 'Indoor sports arena with spectator seating',
      image_url: 'https://example.com/venues/spo_g001.jpg'
    },
    {
      name: 'CC R101',
      location: 'Community Center',
      capacity: 80,
      description: 'Banquet hall with catering facilities',
      image_url: 'https://example.com/venues/cc_r101.jpg'
    }
  ]

  console.log('Creating venues...')
  const createdVenues = await Promise.all(
    venues.map(venue => prisma.venue.create({ data: venue }))
  )

  // Create clubs
  const clubs = [
    {
      name: 'Computer Science Club',
      description: 'Club for computer science enthusiasts focusing on coding, hackathons, and tech talks'
    },
    {
      name: 'Debate Club',
      description: 'Platform for students to develop public speaking and critical thinking skills'
    },
    {
      name: 'Music Club',
      description: 'For students passionate about music performance, composition, and appreciation'
    },
    {
      name: 'Sports Club',
      description: 'Promotes physical fitness and competitive sports activities'
    },
    {
      name: 'Art Club',
      description: 'Creative space for visual arts, crafts, and artistic expression'
    }
  ]

  console.log('Creating clubs...')
  const createdClubs = await Promise.all(
    clubs.map(club => prisma.club.create({ data: club }))
  )

  // Create club members
  const clubMembers = [
    // CS Club
    {
      club_id: createdClubs[0].id,
      user_id: createdUsers[4].id,
      role: 'President'
    },
    // Debate Club
    {
      club_id: createdClubs[1].id,
      user_id: createdUsers[5].id,
      role: 'President'
    },
    // Music Club
    {
      club_id: createdClubs[2].id,
      user_id: createdUsers[6].id,
      role: 'President'
    },
    // Sports Club
    {
      club_id: createdClubs[3].id,
      user_id: createdUsers[7].id,
      role: 'President'
    },
    // Art Club
    {
      club_id: createdClubs[4].id,
      user_id: createdUsers[8].id,
      role: 'President'
    }
  ]

  console.log('Creating club members...')
  await Promise.all(
    clubMembers.map(member => prisma.clubMember.create({ data: member }))
  )

  // Create some venue bookings
  const venueBookings = [
    {
      event_name: 'Tech Talk',
      event_date: new Date('2024-05-01'),
      user_id: createdUsers[4].id,
      venue_id: createdVenues[0].id,
      status: 1
    },
    {
      event_name: 'Debate Competition',
      event_date: new Date('2024-05-05'),
      user_id: createdUsers[5].id,
      venue_id: createdVenues[1].id,
      status: 1
    },
    {
      event_name: 'Music Festival',
      event_date: new Date('2024-05-10'),
      user_id: createdUsers[6].id,
      venue_id: createdVenues[3].id,
      status: 1
    }
  ]

  console.log('Creating venue bookings...')
  const createdBookings = await Promise.all(
    venueBookings.map(booking => prisma.venueBooking.create({ data: booking }))
  )

  // Create approvals
  const approvals = [
    // Coding Workshop approvals
    {
      approver_id: createdUsers[1].id, // FA
      entity_type: 'booking',
      entity_id: createdBookings[0].id,
      action: 'approved',
      remarks: 'Approved by Faculty Advisor'
    },
    {
      approver_id: createdUsers[2].id, // SC
      entity_type: 'booking',
      entity_id: createdBookings[1].id,
      action: 'approved',
      remarks: 'Approved by Student Council'
    },
    {
      approver_id: createdUsers[0].id, // SWO
      entity_type: 'booking',
      entity_id: createdBookings[2].id,
      action: 'approved',
      remarks: 'Approved by SWO'
    },
    {
      approver_id: createdUsers[3].id, // Security
      entity_type: 'booking',
      entity_id: createdBookings[2].id,
      action: 'approved',
      remarks: 'Approved by Security'
    },
    // Annual Music Concert approvals
    {
      approver_id: createdUsers[1].id, // FA
      entity_type: 'booking',
      entity_id: createdBookings[2].id,
      action: 'approved',
      remarks: 'Approved by Faculty Advisor'
    },
    // Basketball Tournament approvals
    {
      approver_id: createdUsers[1].id, // FA
      entity_type: 'booking',
      entity_id: createdBookings[2].id,
      action: 'approved',
      remarks: 'Approved by Faculty Advisor'
    },
    {
      approver_id: createdUsers[2].id, // SC
      entity_type: 'booking',
      entity_id: createdBookings[2].id,
      action: 'approved',
      remarks: 'Approved by Student Council'
    },
    // Late Night Jam Session approvals
    {
      approver_id: createdUsers[1].id, // FA
      entity_type: 'booking',
      entity_id: createdBookings[2].id,
      action: 'approved',
      remarks: 'Approved by Faculty Advisor'
    },
    {
      approver_id: createdUsers[2].id, // SC
      entity_type: 'booking',
      entity_id: createdBookings[2].id,
      action: 'rejected',
      remarks: 'Event timing extends beyond allowed hours'
    }
  ]

  console.log('Creating approvals...')
  await Promise.all(
    approvals.map(approval => prisma.approval.create({ data: approval }))
  )

  // Create proposals
  const proposals = [
    {
      proposer_id: createdUsers[4].id, // cs_president
      title: 'Advanced Programming Workshop',
      description: 'Follow-up workshop on advanced programming concepts',
      event_type: 'Educational',
      requested_date: new Date('2025-05-15T14:00:00Z'),
      status: 'Under Review'
    },
    {
      proposer_id: createdUsers[5].id, // debate_president
      title: 'Freshers Debate Championship',
      description: 'Debate competition for first-year students',
      event_type: 'Competition',
      requested_date: new Date('2025-05-20T10:00:00Z'),
      status: 'Under Review'
    },
    {
      proposer_id: createdUsers[6].id, // music_president
      title: 'Open Air Concert',
      description: 'Music performance in the campus garden',
      event_type: 'Cultural',
      requested_date: new Date('2025-05-25T17:00:00Z'),
      status: 'Under Review'
    }
  ]

  console.log('Creating proposals...')
  await Promise.all(
    proposals.map(proposal => prisma.proposal.create({ data: proposal }))
  )

  // Create event feedback
  const feedback = [
    {
      event_id: createdBookings[0].id, // Tech Talk
      user_id: createdUsers[4].id, // cs_president
      rating: 5,
      comments: 'Excellent workshop, very informative and well-organized'
    },
    {
      event_id: createdBookings[1].id,
      user_id: createdUsers[5].id,
      rating: 4,
      comments: 'Great content but venue was slightly cramped'
    },
    {
      event_id: createdBookings[2].id,
      user_id: createdUsers[6].id,
      rating: 5,
      comments: 'Loved the hands-on approach to learning'
    }
  ]

  console.log('Creating event feedback...')
  await Promise.all(
    feedback.map(f => prisma.eventFeedback.create({ data: f }))
  )

  // Create reports
  const reports = [
    {
      reporter_id: createdUsers[4].id, // cs_president
      report_type: 'Facility Issue',
      content: 'Projector in AB1 R5006 had connectivity issues during the workshop',
      event_id: createdBookings[0].id,
      status: 'Pending'
    },
    {
      reporter_id: createdUsers[6].id, // music_president
      report_type: 'Equipment Request',
      content: 'Need additional microphones for the upcoming music concert',
      event_id: createdBookings[2].id,
      status: 'Pending'
    },
    {
      reporter_id: createdUsers[7].id, // sports_president
      report_type: 'Security Concern',
      content: 'Need additional security personnel for the basketball tournament',
      event_id: createdBookings[2].id,
      status: 'Pending'
    }
  ]

  console.log('Creating reports...')
  await Promise.all(
    reports.map(report => prisma.report.create({ data: report }))
  )

  // Create calendar notifications
  const notifications = [
    {
      user_id: createdUsers[4].id, // cs_president
      event_id: createdBookings[0].id,
      notification_type: 'reminder',
      sent_at: new Date('2025-04-19T14:00:00Z')
    },
    {
      user_id: createdUsers[1].id, // FA
      event_id: createdBookings[1].id,
      notification_type: 'approval_needed',
      sent_at: new Date('2025-04-05T09:15:00Z')
    },
    {
      user_id: createdUsers[2].id, // SC
      event_id: createdBookings[2].id,
      notification_type: 'approval_needed',
      sent_at: new Date('2025-04-02T14:30:00Z')
    },
    {
      user_id: createdUsers[0].id, // SWO
      event_id: createdBookings[2].id,
      notification_type: 'approval_needed',
      sent_at: new Date('2025-04-07T13:20:00Z')
    }
  ]

  console.log('Creating calendar notifications...')
  await Promise.all(
    notifications.map(notification => prisma.calendarNotification.create({ data: notification }))
  )

  // Create venue catalogue entries
  const catalogueEntries = [
    {
      venue_id: createdVenues[0].id, // AB1 R5006
      image_url: 'https://example.com/venues/ab1_r5006_detail1.jpg',
      additional_details: 'Room equipped with 50 chairs, instructor desk, projector, whiteboard, and air conditioning.'
    },
    {
      venue_id: createdVenues[1].id, // AB1 R3002
      image_url: 'https://example.com/venues/ab1_r3002_detail1.jpg',
      additional_details: 'Lecture hall with 100 fixed seats, podium, dual projectors, and sound system.'
    },
    {
      venue_id: createdVenues[3].id, // AB3 R1001
      image_url: 'https://example.com/venues/ab3_r1001_detail1.jpg',
      additional_details: 'Auditorium with stage, professional lighting, sound system, and backstage rooms.'
    }
  ]

  console.log('Creating venue catalogue entries...')
  await Promise.all(
    catalogueEntries.map(entry => prisma.venueCatalogue.create({ data: entry }))
  )

  // Create audit logs
  const auditLogs = [
    {
      user_id: createdUsers[4].id, // cs_president
      entity_type: 'venue_booking',
      entity_id: createdBookings[0].id,
      action: 'create',
      timestamp: new Date('2025-04-01T10:00:00Z')
    },
    {
      user_id: createdUsers[1].id, // FA
      entity_type: 'approval',
      entity_id: 1,
      action: 'approve',
      timestamp: new Date('2025-04-02T09:30:00Z')
    },
    {
      user_id: createdUsers[2].id, // SC
      entity_type: 'approval',
      entity_id: 2,
      action: 'approve',
      timestamp: new Date('2025-04-02T14:45:00Z')
    },
    {
      user_id: createdUsers[0].id, // SWO
      entity_type: 'approval',
      entity_id: 3,
      action: 'approve',
      timestamp: new Date('2025-04-03T10:15:00Z')
    },
    {
      user_id: createdUsers[3].id, // Security
      entity_type: 'approval',
      entity_id: 4,
      action: 'approve',
      timestamp: new Date('2025-04-03T15:30:00Z')
    }
  ]

  console.log('Creating audit logs...')
  await Promise.all(
    auditLogs.map(log => prisma.auditLog.create({ data: log }))
  )

  // Create event history
  const eventHistory = [
    {
      venue_booking_id: createdBookings[0].id,
      event_status: 'completed',
      feedback: 'Event successfully conducted with 45 attendees'
    },
    {
      venue_booking_id: createdBookings[1].id,
      event_status: 'pending',
      feedback: null
    },
    {
      venue_booking_id: createdBookings[2].id,
      event_status: 'cancelled',
      feedback: 'Event cancelled due to rejection'
    }
  ]

  console.log('Creating event history...')
  await Promise.all(
    eventHistory.map(history => prisma.eventHistory.create({ data: history }))
  )

  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 