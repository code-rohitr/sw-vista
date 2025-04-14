/*
  Warnings:

  - Added the required column `end_time` to the `venue_bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `venue_bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "venue_bookings" ADD COLUMN     "end_time" TIMESTAMP(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '2 hours'),
ADD COLUMN     "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have reasonable default times
UPDATE "venue_bookings" 
SET 
  start_time = event_date,
  end_time = event_date + INTERVAL '2 hours'
WHERE start_time = CURRENT_TIMESTAMP AND end_time = (CURRENT_TIMESTAMP + INTERVAL '2 hours');
