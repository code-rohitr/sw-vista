-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "action" TEXT NOT NULL,
    "scope" TEXT,
    "resource_type" TEXT,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissionResources" (
    "id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissionResources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entityTypes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entityTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entityType_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roleTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roleTemplateVersion" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "changes" JSONB,
    "permissions" JSONB,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roleTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entityRoles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entityType_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entityRoles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entityMembers" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_role_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entityMembers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entityRolePermissions" (
    "id" TEXT NOT NULL,
    "entity_role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entityRolePermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entityAcl" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" TEXT,
    "role_id" TEXT,
    "permission_type" TEXT NOT NULL,
    "conditions" JSONB,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entityAcl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userSession" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_active" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_info" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "userSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apiUsage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "response_time" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflowRequest" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "requestor_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflowRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflowApproval" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "approver_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflowApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "approver_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "session_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'success',
    "error_details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER NOT NULL,
    "amenities" TEXT,
    "entity_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueBooking" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "venue_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "approved_by" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenueBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissionResources_permission_id_resource_id_key" ON "permissionResources"("permission_id", "resource_id");

-- CreateIndex
CREATE UNIQUE INDEX "entityTypes_name_key" ON "entityTypes"("name");

-- CreateIndex
CREATE INDEX "roleTemplateVersion_template_id_idx" ON "roleTemplateVersion"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "roleTemplateVersion_template_id_version_number_key" ON "roleTemplateVersion"("template_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "entityMembers_entity_id_user_id_key" ON "entityMembers"("entity_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "entityRolePermissions_entity_role_id_permission_id_resource_key" ON "entityRolePermissions"("entity_role_id", "permission_id", "resource_id");

-- CreateIndex
CREATE INDEX "entityAcl_entity_id_idx" ON "entityAcl"("entity_id");

-- CreateIndex
CREATE INDEX "entityAcl_user_id_idx" ON "entityAcl"("user_id");

-- CreateIndex
CREATE INDEX "entityAcl_role_id_idx" ON "entityAcl"("role_id");

-- CreateIndex
CREATE INDEX "userSession_user_id_idx" ON "userSession"("user_id");

-- CreateIndex
CREATE INDEX "userSession_expires_at_idx" ON "userSession"("expires_at");

-- CreateIndex
CREATE INDEX "apiUsage_user_id_idx" ON "apiUsage"("user_id");

-- CreateIndex
CREATE INDEX "apiUsage_timestamp_idx" ON "apiUsage"("timestamp");

-- CreateIndex
CREATE INDEX "workflowRequest_requestor_id_idx" ON "workflowRequest"("requestor_id");

-- CreateIndex
CREATE INDEX "workflowRequest_entity_id_idx" ON "workflowRequest"("entity_id");

-- CreateIndex
CREATE INDEX "workflowRequest_status_idx" ON "workflowRequest"("status");

-- CreateIndex
CREATE INDEX "workflowApproval_request_id_idx" ON "workflowApproval"("request_id");

-- CreateIndex
CREATE INDEX "workflowApproval_approver_id_idx" ON "workflowApproval"("approver_id");

-- CreateIndex
CREATE INDEX "workflowApproval_status_idx" ON "workflowApproval"("status");

-- CreateIndex
CREATE INDEX "report_reporter_id_idx" ON "report"("reporter_id");

-- CreateIndex
CREATE INDEX "report_status_idx" ON "report"("status");

-- CreateIndex
CREATE INDEX "approval_entity_id_idx" ON "approval"("entity_id");

-- CreateIndex
CREATE INDEX "approval_approver_id_idx" ON "approval"("approver_id");

-- CreateIndex
CREATE INDEX "approval_status_idx" ON "approval"("status");

-- CreateIndex
CREATE INDEX "auditLog_user_id_idx" ON "auditLog"("user_id");

-- CreateIndex
CREATE INDEX "auditLog_entity_type_idx" ON "auditLog"("entity_type");

-- CreateIndex
CREATE INDEX "auditLog_action_idx" ON "auditLog"("action");

-- CreateIndex
CREATE INDEX "auditLog_timestamp_idx" ON "auditLog"("timestamp");

-- CreateIndex
CREATE INDEX "Venue_entity_id_idx" ON "Venue"("entity_id");

-- CreateIndex
CREATE INDEX "VenueBooking_venue_id_idx" ON "VenueBooking"("venue_id");

-- CreateIndex
CREATE INDEX "VenueBooking_entity_id_idx" ON "VenueBooking"("entity_id");

-- CreateIndex
CREATE INDEX "VenueBooking_status_idx" ON "VenueBooking"("status");

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissionResources" ADD CONSTRAINT "permissionResources_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissionResources" ADD CONSTRAINT "permissionResources_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity" ADD CONSTRAINT "entity_entityType_id_fkey" FOREIGN KEY ("entityType_id") REFERENCES "entityTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity" ADD CONSTRAINT "entity_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roleTemplateVersion" ADD CONSTRAINT "roleTemplateVersion_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "roleTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roleTemplateVersion" ADD CONSTRAINT "roleTemplateVersion_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entityRoles" ADD CONSTRAINT "entityRoles_entityType_id_fkey" FOREIGN KEY ("entityType_id") REFERENCES "entityTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entityRoles" ADD CONSTRAINT "entityRoles_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entityRoles" ADD CONSTRAINT "entityRoles_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "roleTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entityMembers" ADD CONSTRAINT "entityMembers_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entityMembers" ADD CONSTRAINT "entityMembers_entity_role_id_fkey" FOREIGN KEY ("entity_role_id") REFERENCES "entityRoles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entityMembers" ADD CONSTRAINT "entityMembers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entityRolePermissions" ADD CONSTRAINT "entityRolePermissions_entity_role_id_fkey" FOREIGN KEY ("entity_role_id") REFERENCES "entityRoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entityRolePermissions" ADD CONSTRAINT "entityRolePermissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entityRolePermissions" ADD CONSTRAINT "entityRolePermissions_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entityAcl" ADD CONSTRAINT "entityAcl_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entityAcl" ADD CONSTRAINT "entityAcl_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entityAcl" ADD CONSTRAINT "entityAcl_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "entityRoles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entityAcl" ADD CONSTRAINT "entityAcl_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userSession" ADD CONSTRAINT "userSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apiUsage" ADD CONSTRAINT "apiUsage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflowRequest" ADD CONSTRAINT "workflowRequest_requestor_id_fkey" FOREIGN KEY ("requestor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflowRequest" ADD CONSTRAINT "workflowRequest_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflowApproval" ADD CONSTRAINT "workflowApproval_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "workflowRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflowApproval" ADD CONSTRAINT "workflowApproval_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval" ADD CONSTRAINT "approval_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval" ADD CONSTRAINT "approval_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditLog" ADD CONSTRAINT "auditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditLog" ADD CONSTRAINT "auditLog_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "userSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueBooking" ADD CONSTRAINT "VenueBooking_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueBooking" ADD CONSTRAINT "VenueBooking_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueBooking" ADD CONSTRAINT "VenueBooking_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueBooking" ADD CONSTRAINT "VenueBooking_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
