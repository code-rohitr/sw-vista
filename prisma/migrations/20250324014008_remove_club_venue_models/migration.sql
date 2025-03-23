-- First drop foreign key constraints
ALTER TABLE "Reports" DROP CONSTRAINT IF EXISTS "Reports_event_id_fkey";
ALTER TABLE "Reports" DROP CONSTRAINT IF EXISTS "Reports_venue_id_fkey";

-- Drop columns from Reports table
ALTER TABLE "Reports" DROP COLUMN IF EXISTS "event_id";
ALTER TABLE "Reports" DROP COLUMN IF EXISTS "venue_id";

-- Drop tables in correct order
DROP TABLE IF EXISTS "EventHistory";
DROP TABLE IF EXISTS "VenueCatalogue";
DROP TABLE IF EXISTS "EventFeedback";
DROP TABLE IF EXISTS "VenueBookings";
DROP TABLE IF EXISTS "Venues";
DROP TABLE IF EXISTS "ClubMembers";
DROP TABLE IF EXISTS "Clubs";
DROP TABLE IF EXISTS "CalendarNotifications";
DROP TABLE IF EXISTS "Proposals";

-- Remove references from Users model
ALTER TABLE "Users" DROP COLUMN IF EXISTS "clubMembers";
ALTER TABLE "Users" DROP COLUMN IF EXISTS "feedbacks";
ALTER TABLE "Users" DROP COLUMN IF EXISTS "proposals";
ALTER TABLE "Users" DROP COLUMN IF EXISTS "notifications";
ALTER TABLE "Users" DROP COLUMN IF EXISTS "bookings";
