/*
  Warnings:

  - You are about to drop the column `approved_by` on the `VenueBooking` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "VenueBooking" DROP CONSTRAINT "VenueBooking_approved_by_fkey";

-- AlterTable
ALTER TABLE "VenueBooking" DROP COLUMN "approved_by";

-- CreateTable
CREATE TABLE "VenueBookingApproval" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "approver_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenueBookingApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityApprover" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "approver_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityApprover_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VenueBookingApproval_booking_id_idx" ON "VenueBookingApproval"("booking_id");

-- CreateIndex
CREATE INDEX "VenueBookingApproval_approver_id_idx" ON "VenueBookingApproval"("approver_id");

-- CreateIndex
CREATE INDEX "VenueBookingApproval_status_idx" ON "VenueBookingApproval"("status");

-- CreateIndex
CREATE INDEX "EntityApprover_entity_id_idx" ON "EntityApprover"("entity_id");

-- CreateIndex
CREATE INDEX "EntityApprover_approver_id_idx" ON "EntityApprover"("approver_id");

-- CreateIndex
CREATE UNIQUE INDEX "EntityApprover_entity_id_approver_id_key" ON "EntityApprover"("entity_id", "approver_id");

-- AddForeignKey
ALTER TABLE "VenueBookingApproval" ADD CONSTRAINT "VenueBookingApproval_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "VenueBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueBookingApproval" ADD CONSTRAINT "VenueBookingApproval_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityApprover" ADD CONSTRAINT "EntityApprover_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityApprover" ADD CONSTRAINT "EntityApprover_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityApprover" ADD CONSTRAINT "EntityApprover_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
