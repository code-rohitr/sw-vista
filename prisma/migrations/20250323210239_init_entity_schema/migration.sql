-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissionResources" (
    "id" SERIAL NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "resource_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissionResources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entityRolePermissions" (
    "id" SERIAL NOT NULL,
    "entity_role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "resource_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entityRolePermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entityTypes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entityTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entity_type_id" INTEGER NOT NULL,

    CONSTRAINT "entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entityRoles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entity_type_id" INTEGER NOT NULL,
    "entity_id" INTEGER,
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "entityRoles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entityMembers" (
    "id" SERIAL NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "entity_role_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entityMembers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report" (
    "id" SERIAL NOT NULL,
    "reporter_id" INTEGER NOT NULL,
    "report_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval" (
    "id" SERIAL NOT NULL,
    "approver_id" INTEGER NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditLog" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "resources_name_key" ON "resources"("name");

-- CreateIndex
CREATE UNIQUE INDEX "resources_path_key" ON "resources"("path");

-- CreateIndex
CREATE UNIQUE INDEX "permissionResources_permission_id_resource_id_key" ON "permissionResources"("permission_id", "resource_id");

-- CreateIndex
CREATE UNIQUE INDEX "entityRolePermissions_entity_role_id_permission_id_resource_key" ON "entityRolePermissions"("entity_role_id", "permission_id", "resource_id");

-- CreateIndex
CREATE UNIQUE INDEX "entityTypes_name_key" ON "entityTypes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "entityRoles_name_entity_type_id_key" ON "entityRoles"("name", "entity_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "entityRoles_name_entity_id_key" ON "entityRoles"("name", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "entityMembers_entity_id_user_id_key" ON "entityMembers"("entity_id", "user_id");

-- AddForeignKey
ALTER TABLE "permissionResources" ADD CONSTRAINT "permissionResources_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissionResources" ADD CONSTRAINT "permissionResources_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entityRolePermissions" ADD CONSTRAINT "entityRolePermissions_entity_role_id_fkey" FOREIGN KEY ("entity_role_id") REFERENCES "entityRoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entityRolePermissions" ADD CONSTRAINT "entityRolePermissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entityRolePermissions" ADD CONSTRAINT "entityRolePermissions_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity" ADD CONSTRAINT "entity_entity_type_id_fkey" FOREIGN KEY ("entity_type_id") REFERENCES "entityTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entityRoles" ADD CONSTRAINT "entityRoles_entity_type_id_fkey" FOREIGN KEY ("entity_type_id") REFERENCES "entityTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entityRoles" ADD CONSTRAINT "entityRoles_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entityMembers" ADD CONSTRAINT "entityMembers_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entityMembers" ADD CONSTRAINT "entityMembers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entityMembers" ADD CONSTRAINT "entityMembers_entity_role_id_fkey" FOREIGN KEY ("entity_role_id") REFERENCES "entityRoles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval" ADD CONSTRAINT "approval_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval" ADD CONSTRAINT "approval_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditLog" ADD CONSTRAINT "auditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
