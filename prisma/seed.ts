import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Create user roles
  const roles = [
    {
      role_name: 'admin',
      permissions: JSON.stringify([
        'manage_users',
        'manage_venues',
        'manage_bookings',
        'manage_clubs',
        'approve_bookings',
        'view_reports',
        'manage_system'
      ])
    },
    {
      role_name: 'club',
      permissions: JSON.stringify([
        'manage_club_events',
        'create_bookings',
        'view_venues',
        'manage_club_members'
      ])
    },
    {
      role_name: 'faculty_advisor',
      permissions: JSON.stringify([
        'approve_club_events',
        'view_venues',
        'view_reports',
        'manage_assigned_clubs'
      ])
    },
    {
      role_name: 'sw_director',
      permissions: JSON.stringify([
        'manage_venues',
        'approve_bookings',
        'view_reports',
        'manage_faculty'
      ])
    },
    {
      role_name: 'student_council',
      permissions: JSON.stringify([
        'create_bookings',
        'view_venues',
        'manage_student_events',
        'create_reports'
      ])
    },
    {
      role_name: 'security',
      permissions: JSON.stringify([
        'view_bookings',
        'view_venues',
        'manage_venue_access',
        'create_incident_reports'
      ])
    }
  ]

  for (const role of roles) {
    await prisma.userRole.create({
      data: role
    })
  }

  // Create sample users
  const defaultPassword = await bcrypt.hash('password123', 10)
  
  const users = [
    {
      username: 'admin',
      email: 'admin@swvista.com',
      password_hash: defaultPassword,
      role: 'admin'
    },
    {
      username: 'cs_president',
      email: 'cs_president@swvista.com',
      password_hash: defaultPassword,
      role: 'club'
    },
    {
      username: 'faculty_advisor1',
      email: 'faculty1@swvista.com',
      password_hash: defaultPassword,
      role: 'faculty_advisor'
    },
    {
      username: 'sw_director',
      email: 'director@swvista.com',
      password_hash: defaultPassword,
      role: 'sw_director'
    },
    {
      username: 'student_council_president',
      email: 'council@swvista.com',
      password_hash: defaultPassword,
      role: 'student_council'
    },
    {
      username: 'security_chief',
      email: 'security@swvista.com',
      password_hash: defaultPassword,
      role: 'security'
    }
  ]

  const createdUsers = []
  for (const user of users) {
    const createdUser = await prisma.user.create({
      data: user
    })
    createdUsers.push(createdUser)
  }

  // Create sample clubs
  const clubs = [
    {
      name: 'Computer Science Society',
      description: 'Club for computer science enthusiasts'
    },
    {
      name: 'Robotics Club',
      description: 'Building and programming robots'
    },
    {
      name: 'AI Research Group',
      description: 'Exploring artificial intelligence and machine learning'
    },
    {
      name: 'Cybersecurity Club',
      description: 'Learning about information security'
    }
  ]

  const createdClubs = []
  for (const club of clubs) {
    const createdClub = await prisma.club.create({
      data: club
    })
    createdClubs.push(createdClub)
  }

  // Create sample venues
  const venues = [
    {
      name: 'Main Auditorium',
      location: 'Building A, Ground Floor',
      capacity: 500,
      description: 'Large auditorium for major events',
      image_url: 'https://example.com/auditorium.jpg'
    },
    {
      name: 'Conference Room 1',
      location: 'Building B, First Floor',
      capacity: 50,
      description: 'Medium-sized conference room',
      image_url: 'https://example.com/conf1.jpg'
    },
    {
      name: 'Seminar Hall',
      location: 'Building C, Second Floor',
      capacity: 100,
      description: 'Seminar hall with presentation equipment',
      image_url: 'https://example.com/seminar.jpg'
    },
    {
      name: 'Lab 101',
      location: 'Building D, Ground Floor',
      capacity: 30,
      description: 'Computer lab with workstations',
      image_url: 'https://example.com/lab101.jpg'
    }
  ]

  const createdVenues = []
  for (const venue of venues) {
    const createdVenue = await prisma.venue.create({
      data: venue
    })
    createdVenues.push(createdVenue)
  }

  // Create sample club memberships
  const clubMemberships = [
    {
      club_id: createdClubs[0].id, // CS Society
      user_id: createdUsers[1].id, // CS President
      role: 'president'
    },
    {
      club_id: createdClubs[1].id, // Robotics Club
      user_id: createdUsers[2].id, // Faculty Advisor
      role: 'advisor'
    }
  ]

  for (const membership of clubMemberships) {
    await prisma.clubMember.create({
      data: membership
    })
  }

  // Create sample venue bookings
  const venueBookings = [
    {
      user_id: createdUsers[1].id,
      venue_id: createdVenues[0].id,
      event_name: 'CS Tech Talk',
      event_description: 'Annual technology conference',
      event_date: new Date('2024-04-15T14:00:00Z'),
      status: 'pending'
    },
    {
      user_id: createdUsers[4].id,
      venue_id: createdVenues[2].id,
      event_name: 'Student Council Meeting',
      event_description: 'Monthly general meeting',
      event_date: new Date('2024-04-20T10:00:00Z'),
      status: 'approved'
    }
  ]

  for (const booking of venueBookings) {
    await prisma.venueBooking.create({
      data: booking
    })
  }

  console.log('Database seeded with initial data!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 