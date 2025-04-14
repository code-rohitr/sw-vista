/*
  Warnings:

  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `updated_at` on the `users` table. All the data in the column will be lost.
  - The `id` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `EntityApprover` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Venue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VenueBooking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VenueBookingApproval` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `apiUsage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `approval` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `auditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `entity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `entityAcl` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `entityMembers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `entityRolePermissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `entityRoles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `entityTypes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permissionResources` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `report` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `resources` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roleTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roleTemplateVersion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `userSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `workflowApproval` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `workflowRequest` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `role` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EntityApprover" DROP CONSTRAINT "EntityApprover_approver_id_fkey";

-- DropForeignKey
ALTER TABLE "EntityApprover" DROP CONSTRAINT "EntityApprover_created_by_fkey";

-- DropForeignKey
ALTER TABLE "EntityApprover" DROP CONSTRAINT "EntityApprover_entity_id_fkey";

-- DropForeignKey
ALTER TABLE "Venue" DROP CONSTRAINT "Venue_entity_id_fkey";

-- DropForeignKey
ALTER TABLE "VenueBooking" DROP CONSTRAINT "VenueBooking_created_by_fkey";

-- DropForeignKey
ALTER TABLE "VenueBooking" DROP CONSTRAINT "VenueBooking_entity_id_fkey";

-- DropForeignKey
ALTER TABLE "VenueBooking" DROP CONSTRAINT "VenueBooking_venue_id_fkey";

-- DropForeignKey
ALTER TABLE "VenueBookingApproval" DROP CONSTRAINT "VenueBookingApproval_approver_id_fkey";

-- DropForeignKey
ALTER TABLE "VenueBookingApproval" DROP CONSTRAINT "VenueBookingApproval_booking_id_fkey";

-- DropForeignKey
ALTER TABLE "apiUsage" DROP CONSTRAINT "apiUsage_user_id_fkey";

-- DropForeignKey
ALTER TABLE "approval" DROP CONSTRAINT "approval_approver_id_fkey";

-- DropForeignKey
ALTER TABLE "approval" DROP CONSTRAINT "approval_entity_id_fkey";

-- DropForeignKey
ALTER TABLE "auditLog" DROP CONSTRAINT "auditLog_session_id_fkey";

-- DropForeignKey
ALTER TABLE "auditLog" DROP CONSTRAINT "auditLog_user_id_fkey";

-- DropForeignKey
ALTER TABLE "entity" DROP CONSTRAINT "entity_entityType_id_fkey";

-- DropForeignKey
ALTER TABLE "entity" DROP CONSTRAINT "entity_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "entityAcl" DROP CONSTRAINT "entityAcl_created_by_fkey";

-- DropForeignKey
ALTER TABLE "entityAcl" DROP CONSTRAINT "entityAcl_entity_id_fkey";

-- DropForeignKey
ALTER TABLE "entityAcl" DROP CONSTRAINT "entityAcl_role_id_fkey";

-- DropForeignKey
ALTER TABLE "entityAcl" DROP CONSTRAINT "entityAcl_user_id_fkey";

-- DropForeignKey
ALTER TABLE "entityMembers" DROP CONSTRAINT "entityMembers_entity_id_fkey";

-- DropForeignKey
ALTER TABLE "entityMembers" DROP CONSTRAINT "entityMembers_entity_role_id_fkey";

-- DropForeignKey
ALTER TABLE "entityMembers" DROP CONSTRAINT "entityMembers_user_id_fkey";

-- DropForeignKey
ALTER TABLE "entityRolePermissions" DROP CONSTRAINT "entityRolePermissions_entity_role_id_fkey";

-- DropForeignKey
ALTER TABLE "entityRolePermissions" DROP CONSTRAINT "entityRolePermissions_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "entityRolePermissions" DROP CONSTRAINT "entityRolePermissions_resource_id_fkey";

-- DropForeignKey
ALTER TABLE "entityRoles" DROP CONSTRAINT "entityRoles_entityType_id_fkey";

-- DropForeignKey
ALTER TABLE "entityRoles" DROP CONSTRAINT "entityRoles_entity_id_fkey";

-- DropForeignKey
ALTER TABLE "entityRoles" DROP CONSTRAINT "entityRoles_template_id_fkey";

-- DropForeignKey
ALTER TABLE "permissionResources" DROP CONSTRAINT "permissionResources_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "permissionResources" DROP CONSTRAINT "permissionResources_resource_id_fkey";

-- DropForeignKey
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_created_by_fkey";

-- DropForeignKey
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "report" DROP CONSTRAINT "report_reporter_id_fkey";

-- DropForeignKey
ALTER TABLE "roleTemplateVersion" DROP CONSTRAINT "roleTemplateVersion_created_by_fkey";

-- DropForeignKey
ALTER TABLE "roleTemplateVersion" DROP CONSTRAINT "roleTemplateVersion_template_id_fkey";

-- DropForeignKey
ALTER TABLE "userSession" DROP CONSTRAINT "userSession_user_id_fkey";

-- DropForeignKey
ALTER TABLE "workflowApproval" DROP CONSTRAINT "workflowApproval_approver_id_fkey";

-- DropForeignKey
ALTER TABLE "workflowApproval" DROP CONSTRAINT "workflowApproval_request_id_fkey";

-- DropForeignKey
ALTER TABLE "workflowRequest" DROP CONSTRAINT "workflowRequest_entity_id_fkey";

-- DropForeignKey
ALTER TABLE "workflowRequest" DROP CONSTRAINT "workflowRequest_requestor_id_fkey";

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "updated_at",
ADD COLUMN     "role" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "EntityApprover";

-- DropTable
DROP TABLE "Venue";

-- DropTable
DROP TABLE "VenueBooking";

-- DropTable
DROP TABLE "VenueBookingApproval";

-- DropTable
DROP TABLE "apiUsage";

-- DropTable
DROP TABLE "approval";

-- DropTable
DROP TABLE "auditLog";

-- DropTable
DROP TABLE "entity";

-- DropTable
DROP TABLE "entityAcl";

-- DropTable
DROP TABLE "entityMembers";

-- DropTable
DROP TABLE "entityRolePermissions";

-- DropTable
DROP TABLE "entityRoles";

-- DropTable
DROP TABLE "entityTypes";

-- DropTable
DROP TABLE "permissionResources";

-- DropTable
DROP TABLE "permissions";

-- DropTable
DROP TABLE "report";

-- DropTable
DROP TABLE "resources";

-- DropTable
DROP TABLE "roleTemplate";

-- DropTable
DROP TABLE "roleTemplateVersion";

-- DropTable
DROP TABLE "userSession";

-- DropTable
DROP TABLE "workflowApproval";

-- DropTable
DROP TABLE "workflowRequest";

-- CreateTable
CREATE TABLE "user_roles" (
    "id" SERIAL NOT NULL,
    "role_name" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venues" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "description" TEXT,
    "image_url" TEXT,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_bookings" (
    "id" SERIAL NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" INTEGER NOT NULL DEFAULT 1,
    "user_id" INTEGER NOT NULL,
    "venue_id" INTEGER NOT NULL,

    CONSTRAINT "venue_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_feedback" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" SERIAL NOT NULL,
    "proposer_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_type" TEXT NOT NULL,
    "requested_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "reporter_id" INTEGER NOT NULL,
    "report_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "event_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clubs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_members" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "event_id" INTEGER NOT NULL,
    "notification_type" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_catalogue" (
    "id" SERIAL NOT NULL,
    "venue_id" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "additional_details" TEXT,

    CONSTRAINT "venue_catalogue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_history" (
    "id" SERIAL NOT NULL,
    "venue_booking_id" INTEGER NOT NULL,
    "event_status" TEXT NOT NULL,
    "feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" SERIAL NOT NULL,
    "approver_id" INTEGER NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_role_name_key" ON "user_roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "clubs_name_key" ON "clubs"("name");

-- AddForeignKey
ALTER TABLE "venue_bookings" ADD CONSTRAINT "venue_bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_bookings" ADD CONSTRAINT "venue_bookings_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_feedback" ADD CONSTRAINT "event_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_proposer_id_fkey" FOREIGN KEY ("proposer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "venue_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_notifications" ADD CONSTRAINT "calendar_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_catalogue" ADD CONSTRAINT "venue_catalogue_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_history" ADD CONSTRAINT "event_history_venue_booking_id_fkey" FOREIGN KEY ("venue_booking_id") REFERENCES "venue_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
