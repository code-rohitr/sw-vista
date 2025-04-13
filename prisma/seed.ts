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
  const createdRoles = []
  for (const role of roles) {
    const createdRole = await prisma.userRole.create({
      data: role
    })
    createdRoles.push(createdRole)
  }

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
  const createdUsers = []
  for (const user of users) {
    const createdUser = await prisma.user.create({
      data: user
    })
    createdUsers.push(createdUser)
  }

  // Create placeholder users for anonymous members and feedback
  const placeholderUsers = []
  for (let i = 1; i <= 30; i++) {
    const placeholderUser = await prisma.user.create({
      data: {
        username: `anonymous_user_${i}`,
        email: `anonymous${i}@placeholder.edu`,
        password_hash: defaultPassword,
        role: 'ANONYMOUS'
      }
    })
    placeholderUsers.push(placeholderUser)
  }

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
  const createdVenues = []
  for (const venue of venues) {
    const createdVenue = await prisma.venue.create({
      data: venue
    })
    createdVenues.push(createdVenue)
  }

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
  const createdClubs = []
  for (const club of clubs) {
    const createdClub = await prisma.club.create({
      data: club
    })
    createdClubs.push(createdClub)
  }

  // Create club members
  const clubMembers = [
    // CS Club
    {
      club_id: createdClubs[0].id,
      user_id: createdUsers[4].id, // cs_president
      role: 'President'
    },
    // Debate Club
    {
      club_id: createdClubs[1].id,
      user_id: createdUsers[5].id, // debate_president
      role: 'President'
    },
    // Music Club
    {
      club_id: createdClubs[2].id,
      user_id: createdUsers[6].id, // music_president
      role: 'President'
    },
    // Sports Club
    {
      club_id: createdClubs[3].id,
      user_id: createdUsers[7].id, // sports_president
      role: 'President'
    },
    // Art Club
    {
      club_id: createdClubs[4].id,
      user_id: createdUsers[8].id, // art_president
      role: 'President'
    }
  ]

  // Add regular members (5 for each club)
  let placeholderIndex = 0
  for (let i = 0; i < 5; i++) {
    for (let clubIndex = 0; clubIndex < createdClubs.length; clubIndex++) {
      clubMembers.push({
        club_id: createdClubs[clubIndex].id,
        user_id: placeholderUsers[placeholderIndex++].id,
        role: 'Member'
      })
    }
  }

  console.log('Creating club members...')
  for (const member of clubMembers) {
    await prisma.clubMember.create({
      data: member
    })
  }

  // Create venue bookings
  const venueBookings = await Promise.all([
    prisma.venueBooking.create({
      data: {
        event_name: "Annual Tech Fest",
        event_date: new Date("2024-05-15"),
        status: 1, // Submitted
        user: {
          connect: { id: users[0].id }
        },
        venue: {
          connect: { id: venues[0].id }
        }
      }
    }),
    prisma.venueBooking.create({
      data: {
        event_name: "Cultural Night",
        event_date: new Date("2024-06-01"),
        status: 2, // FA Approved
        user: {
          connect: { id: users[1].id }
        },
        venue: {
          connect: { id: venues[1].id }
        }
      }
    }),
    prisma.venueBooking.create({
      data: {
        event_name: "Sports Day",
        event_date: new Date("2024-07-10"),
        status: 3, // SC Approved
        user: {
          connect: { id: users[2].id }
        },
        venue: {
          connect: { id: venues[2].id }
        }
      }
    }),
    prisma.venueBooking.create({
      data: {
        event_name: "Alumni Meet",
        event_date: new Date("2024-08-20"),
        status: 4, // SWO Approved
        user: {
          connect: { id: users[3].id }
        },
        venue: {
          connect: { id: venues[0].id }
        }
      }
    }),
    prisma.venueBooking.create({
      data: {
        event_name: "Graduation Ceremony",
        event_date: new Date("2024-09-05"),
        status: 5, // Security Approved (Final)
        user: {
          connect: { id: users[4].id }
        },
        venue: {
          connect: { id: venues[1].id }
        }
      }
    }),
    prisma.venueBooking.create({
      data: {
        event_name: "Rejected Event",
        event_date: new Date("2024-10-01"),
        status: 0, // Rejected
        user: {
          connect: { id: users[5].id }
        },
        venue: {
          connect: { id: venues[2].id }
        }
      }
    })
  ]);

  // Create approvals
  const approvals = [
    // Coding Workshop approvals
    {
      approver_id: createdUsers[1].id, // FA
      entity_type: 'booking',
      entity_id: venueBookings[0].id,
      action: 'approved',
      remarks: 'Approved by Faculty Advisor'
    },
    {
      approver_id: createdUsers[2].id, // SC
      entity_type: 'booking',
      entity_id: venueBookings[1].id,
      action: 'approved',
      remarks: 'Approved by Student Council'
    },
    {
      approver_id: createdUsers[0].id, // SWO
      entity_type: 'booking',
      entity_id: venueBookings[2].id,
      action: 'approved',
      remarks: 'Approved by SWO'
    },
    {
      approver_id: createdUsers[3].id, // Security
      entity_type: 'booking',
      entity_id: venueBookings[3].id,
      action: 'approved',
      remarks: 'Approved by Security'
    },
    // Annual Music Concert approvals
    {
      approver_id: createdUsers[1].id, // FA
      entity_type: 'booking',
      entity_id: venueBookings[4].id,
      action: 'approved',
      remarks: 'Approved by Faculty Advisor'
    },
    // Basketball Tournament approvals
    {
      approver_id: createdUsers[1].id, // FA
      entity_type: 'booking',
      entity_id: venueBookings[5].id,
      action: 'approved',
      remarks: 'Approved by Faculty Advisor'
    },
    {
      approver_id: createdUsers[2].id, // SC
      entity_type: 'booking',
      entity_id: venueBookings[5].id,
      action: 'approved',
      remarks: 'Approved by Student Council'
    },
    // Late Night Jam Session approvals
    {
      approver_id: createdUsers[1].id, // FA
      entity_type: 'booking',
      entity_id: venueBookings[6].id,
      action: 'approved',
      remarks: 'Approved by Faculty Advisor'
    },
    {
      approver_id: createdUsers[2].id, // SC
      entity_type: 'booking',
      entity_id: venueBookings[6].id,
      action: 'rejected',
      remarks: 'Event timing extends beyond allowed hours'
    }
  ]

  console.log('Creating approvals...')
  for (const approval of approvals) {
    await prisma.approval.create({
      data: approval
    })
  }

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
  for (const proposal of proposals) {
    await prisma.proposal.create({
      data: proposal
    })
  }

  // Create event feedback
  const feedback = [
    {
      event_id: venueBookings[0].id, // Annual Tech Fest
      user_id: createdUsers[4].id, // cs_president
      rating: 5,
      comments: 'Excellent workshop, very informative and well-organized'
    },
    {
      event_id: venueBookings[1].id,
      user_id: placeholderUsers[25].id,
      rating: 4,
      comments: 'Great content but venue was slightly cramped'
    },
    {
      event_id: venueBookings[2].id,
      user_id: placeholderUsers[26].id,
      rating: 5,
      comments: 'Loved the hands-on approach to learning'
    }
  ]

  console.log('Creating event feedback...')
  for (const f of feedback) {
    await prisma.eventFeedback.create({
      data: f
    })
  }

  // Create reports
  const reports = [
    {
      reporter_id: createdUsers[4].id, // cs_president
      report_type: 'Facility Issue',
      content: 'Projector in AB1 R5006 had connectivity issues during the workshop',
      event_id: venueBookings[0].id,
      status: 'Pending'
    },
    {
      reporter_id: createdUsers[6].id, // music_president
      report_type: 'Equipment Request',
      content: 'Need additional microphones for the upcoming music concert',
      event_id: venueBookings[4].id,
      status: 'Pending'
    },
    {
      reporter_id: createdUsers[7].id, // sports_president
      report_type: 'Security Concern',
      content: 'Need additional security personnel for the basketball tournament',
      event_id: venueBookings[5].id,
      status: 'Pending'
    }
  ]

  console.log('Creating reports...')
  for (const report of reports) {
    await prisma.report.create({
      data: report
    })
  }

  // Create calendar notifications
  const notifications = [
    {
      user_id: createdUsers[4].id, // cs_president
      event_id: venueBookings[0].id,
      notification_type: 'reminder',
      sent_at: new Date('2025-04-19T14:00:00Z')
    },
    {
      user_id: createdUsers[1].id, // FA
      event_id: venueBookings[1].id,
      notification_type: 'approval_needed',
      sent_at: new Date('2025-04-05T09:15:00Z')
    },
    {
      user_id: createdUsers[2].id, // SC
      event_id: venueBookings[2].id,
      notification_type: 'approval_needed',
      sent_at: new Date('2025-04-02T14:30:00Z')
    },
    {
      user_id: createdUsers[0].id, // SWO
      event_id: venueBookings[3].id,
      notification_type: 'approval_needed',
      sent_at: new Date('2025-04-07T13:20:00Z')
    }
  ]

  console.log('Creating calendar notifications...')
  for (const notification of notifications) {
    await prisma.calendarNotification.create({
      data: notification
    })
  }

  // Create venue catalogue entries
  const catalogueEntries = [
    {
      venue_id: venues[0].id, // AB1 R5006
      image_url: 'https://example.com/venues/ab1_r5006_detail1.jpg',
      additional_details: 'Room equipped with 50 chairs, instructor desk, projector, whiteboard, and air conditioning.'
    },
    {
      venue_id: venues[1].id, // AB1 R3002
      image_url: 'https://example.com/venues/ab1_r3002_detail1.jpg',
      additional_details: 'Lecture hall with 100 fixed seats, podium, dual projectors, and sound system.'
    },
    {
      venue_id: venues[3].id, // AB3 R1001
      image_url: 'https://example.com/venues/ab3_r1001_detail1.jpg',
      additional_details: 'Auditorium with stage, professional lighting, sound system, and backstage rooms.'
    }
  ]

  console.log('Creating venue catalogue entries...')
  for (const entry of catalogueEntries) {
    await prisma.venueCatalogue.create({
      data: entry
    })
  }

  // Create audit logs
  const auditLogs = [
    {
      user_id: createdUsers[4].id, // cs_president
      entity_type: 'venue_booking',
      entity_id: venueBookings[0].id,
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
  for (const log of auditLogs) {
    await prisma.auditLog.create({
      data: log
    })
  }

  // Create event history
  const eventHistory = [
    {
      venue_booking_id: venueBookings[0].id,
      event_status: 'completed',
      feedback: 'Event successfully conducted with 45 attendees'
    },
    {
      venue_booking_id: venueBookings[1].id,
      event_status: 'pending',
      feedback: null
    },
    {
      venue_booking_id: venueBookings[6].id,
      event_status: 'cancelled',
      feedback: 'Event cancelled due to rejection'
    }
  ]

  console.log('Creating event history...')
  for (const history of eventHistory) {
    await prisma.eventHistory.create({
      data: history
    })
  }

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